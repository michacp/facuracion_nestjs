import { Injectable, Logger, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SriService } from './sri/sri.service';
import { XmlSignerHelper } from './helpers/xml-signer.helper';
import { InvoiceNumberHelper } from './helpers/invoice-number.helper';
import { generarXMLFactura } from './helpers/xml-templates/factura.template';
import { generarClaveAccesoFactura } from './helpers/access-key.helper';
import { parseStringPromise } from 'xml2js';
import moment from 'moment';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { GenerateInvoiceResponseDto } from './dto/response/generate-invoice-response.dto';
import { SaveSaleBodyDto } from '../ventas/dto/request/save-sale-body.dto';
import { SyncFacturaResponseDto } from './dto/response/sync-factura-response.dto';
import { SyncFacturaBodyDto } from './dto/request/sync-factura-body.dto';
import { FacturaListItemDto, ListFacturasResponseDto } from './dto/response/list-facturas-response.dto';
import { ListFacturasBodyDto } from './dto/request/list-facturas-body.dto';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import { Prisma } from '@prisma/client';
import { CatalogosService } from '../catalogos/catalogos.service';
import { toGuayaquilStartOfDay, toGuayaquilEndOfDay } from './helpers/guayaquil-date.helper';
import { RetryFacturaResponseDto } from './dto/response/retry-factura-response.dto';
import { RetryFacturaBodyDto } from './dto/request/retry-factura-body.dto';

@Injectable()
export class FacturasService {
    private readonly logger = new Logger(FacturasService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly sriService: SriService,
        private readonly signerHelper: XmlSignerHelper,
        private readonly numberHelper: InvoiceNumberHelper,
        private readonly config: ConfigService,
        private readonly driveService: GoogleDriveService,
        private readonly catalogosService: CatalogosService
    ) { }

    async generateInvoice(
        dto: SaveSaleBodyDto,
        ventaId: number,
        user: JwtPayload,
    ): Promise<GenerateInvoiceResponseDto> {
        const ambiente = this.config.getOrThrow<string>('INVOICE_SRI_ENVIRONMENT_TYPE');
        const empresaId = user.empresaId!;
        let numero: number | null = null;

        try {
            // ── 1. Datos de empresa, usuario, sucursal ───────────────────────
            const usuarioEmpresa = await this.prisma.usuarioEmpresa.findFirstOrThrow({
                where: {
                    usuario_empresa_usuarioId: user.sub,
                    usuario_empresa_empresaId: empresaId,
                },
                select: {
                    usuario_empresa_codEmi: true,
                    empresa: {
                        select: {
                            empresas_razonSocial: true,
                            empresas_nombreComercial: true,
                            empresas_ruc: true,
                            empresas_dirMatriz: true,
                            empresas_telefono: true,
                            empresa_email: true,
                            empresas_obligadocontabilidad: true,
                            empresas_agenteRetencion: true,
                            regimen: { select: { regimenes_nombre: true } },
                        },
                    },
                },
            });

            const sucursal = await this.prisma.sucursal.findFirstOrThrow({
                where: { sucursales_empresaId: empresaId, sucursales_nombre: 'MATRIZ' },
                select: {
                    sucursales_id: true,
                    sucursales_cod: true,
                    sucursales_nombre: true,
                    sucursales_direccion: true,
                },
            });

            // ── 2. Tipo de comprobante ───────────────────────────────────────
            const tipoComprobante = await this.prisma.tipoComprobante.findUniqueOrThrow({
                where: { tipo_comprobante_id: dto.tipoComprobante },
                select: { codigo: true },
            });

            // ── 3. Cliente + campos adicionales ─────────────────────────────
            const cliente = await this.prisma.cliente.findUniqueOrThrow({
                where: { id: dto.clienteId },
                select: {
                    identificacion: true,
                    tipo_identificacion: true,
                    razon_social: true,
                    direccion: true,
                    email: true,
                    telefono: true,
                    // ← campos adicionales del cliente (reemplaza el parche hardcodeado)
                    camposAdicionales: {
                        select: { clave: true, valor: true },
                    },
                },
            });

            // ── 4. Número de factura ─────────────────────────────────────────
            numero = await this.numberHelper.obtenerNumeroFactura(sucursal.sucursales_id);

            // ── 5. Clave de acceso ───────────────────────────────────────────
            const serie = `${sucursal.sucursales_cod}${usuarioEmpresa.usuario_empresa_codEmi}`;
            const claveAcceso = generarClaveAccesoFactura(
                usuarioEmpresa.empresa.empresas_ruc,
                ambiente,
                serie,
                numero,
            );

            this.logger.log(`🔑 Clave de acceso: ${claveAcceso}`);

            // ── 6. Productos desde BD (productos con lote + servicios) ───────
            const productosConLote = dto.productos.filter((p) => !p.es_servicio);
            const servicios = dto.productos.filter((p) => p.es_servicio);

            // Lotes (productos físicos)
            const lotes = productosConLote.length > 0
                ? await this.prisma.itemLote.findMany({
                    where: { lote_id: { in: productosConLote.map((p) => p.productoId) } },
                    select: {
                        lote_id: true,
                        numero_lote: true,
                        item: {
                            select: {
                                item_codigo_principal: true,
                                item_codigo_auxiliar: true,
                                item_nombre: true,
                                tarifaImpuesto: {
                                    select: {
                                        tarifa_codigo_sri: true,
                                        tarifa_porcentaje: true,
                                        tipoImpuesto: {
                                            select: { tipo_impuesto_codigo_sri: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                })
                : [];

            // Items directos (servicios)
            const itemsServicio = servicios.length > 0
                ? await this.prisma.item.findMany({
                    where: { item_id: { in: servicios.map((p) => p.productoId) } },
                    select: {
                        item_id: true,
                        item_codigo_principal: true,
                        item_codigo_auxiliar: true,
                        item_nombre: true,
                        tarifaImpuesto: {
                            select: {
                                tarifa_codigo_sri: true,
                                tarifa_porcentaje: true,
                                tipoImpuesto: {
                                    select: { tipo_impuesto_codigo_sri: true },
                                },
                            },
                        },
                    },
                })
                : [];

            // ── 7. Forma de pago ─────────────────────────────────────────────
            const formaPago = await this.prisma.formaPago.findUniqueOrThrow({
                where: { forma_pago_id: dto.formaPago },
                select: { codigo: true },
            });

            // ── 8. Construir detalles XML ────────────────────────────────────
            const lotesMap = new Map(lotes.map((l) => [l.lote_id, l]));
            const itemsMap = new Map(itemsServicio.map((i) => [i.item_id, i]));

            const detalles = dto.productos.map((p) => {
                const infoDB = p.es_servicio
                    ? itemsMap.get(p.productoId)
                    : lotesMap.get(p.productoId)?.item;

                const cantidad = Number(p.cantidad);
                const precio = Number(p.precioUnitario);
                const descuento = Number(p.descuento) || 0;
                const baseImponible = cantidad * precio - descuento;
                const porcentaje = Number(infoDB?.tarifaImpuesto?.tarifa_porcentaje ?? 0);
                const valorIva = parseFloat((baseImponible * porcentaje / 100).toFixed(2));

                return {
                    codigoPrincipal: infoDB?.item_codigo_principal ?? '000',
                    codigoAuxiliar: infoDB?.item_codigo_auxiliar ?? undefined,
                    descripcion: infoDB?.item_nombre ?? 'Sin nombre',
                    cantidad,
                    precioUnitario: precio,
                    descuento,
                    precioTotalSinImpuesto: baseImponible,
                    impuestos: [
                        {
                            codigo: infoDB?.tarifaImpuesto?.tipoImpuesto?.tipo_impuesto_codigo_sri ?? '2',
                            codigoPorcentaje: infoDB?.tarifaImpuesto?.tarifa_codigo_sri ?? '0',
                            baseImponible,
                            tarifa: porcentaje,
                            valor: valorIva,
                        },
                    ],
                };
            });

            // ── 9. Campos adicionales — desde ClienteCampoAdicional ──────────
            // Esto reemplaza el parche hardcodeado del legacy.
            // Se incluyen: email, teléfono, dirección del cliente
            // + TODOS los campos definidos en ClienteCampoAdicional para ese cliente
            const camposAdicionales = [
                { nombre: 'Observaciones', valor: dto.observaciones ?? '' },
                { nombre: 'Email', valor: cliente.email ?? '' },
                { nombre: 'Teléfono', valor: cliente.telefono ?? '' },
                { nombre: 'Dirección', valor: cliente.direccion ?? '' },
                // ← campos personalizados del cliente (ej: "Lugar de entrega", "Contacto", etc.)
                ...cliente.camposAdicionales.map((c) => ({
                    nombre: c.clave,
                    valor: c.valor,
                })),
            ].filter((c) => c.valor.trim() !== '');

            // ── 10. Generar XML ──────────────────────────────────────────────
            const empresa = usuarioEmpresa.empresa;

            const xmlString = generarXMLFactura({
                ambiente,
                tipoEmision: '1',
                razonSocial: empresa.empresas_razonSocial,
                nombreComercial: empresa.empresas_nombreComercial ?? '',
                ruc: empresa.empresas_ruc,
                claveAcceso,
                codDoc: tipoComprobante.codigo,
                estab: sucursal.sucursales_cod,
                ptoEmi: usuarioEmpresa.usuario_empresa_codEmi,
                secuencial: numero.toString().padStart(9, '0'),
                dirMatriz: empresa.empresas_dirMatriz,
                regimenMicroempresas: empresa.regimen?.regimenes_nombre ?? 'NO',
                agenteRetencion: empresa.empresas_agenteRetencion,
                fechaEmision: moment(dto.fechaEmision).format('DD/MM/YYYY'),
                dirEstablecimiento: sucursal.sucursales_direccion,
                obligadoContabilidad: empresa.empresas_obligadocontabilidad,
                tipoIdentificacionComprador: cliente.tipo_identificacion,
                razonSocialComprador: cliente.razon_social,
                identificacionComprador: cliente.identificacion,
                totalSinImpuestos: Number(dto.subtotal),
                totalDescuento: Number(dto.descuentoTotal),
                propina: Number(dto.propina),
                importeTotal: Number(dto.total),
                moneda: 'DOLAR',
                pagoFormaPago: formaPago.codigo,
                pagoTotal: Number(dto.total),
                unidadTiempo: '',
                plazo: dto.plazoPago ?? '',
                detalles,
                camposAdicionales,
            });

            // ── 11. Firmar XML ───────────────────────────────────────────────────
            const xmlFirmado = await this.signerHelper.firmarXML(empresaId, xmlString);

            // ── NUEVO: Guardar XML firmado en Drive ANTES de enviar al SRI ────
            // Si el SRI falla, ya tenemos el XML con la fecha correcta
            const xmlBuffer = Buffer.from(xmlFirmado, 'utf-8');
            const carpetaPending = `${empresaId}/facturas/pendiente_envio`;

            let driveFileIdPrevio: string | null = null;
            try {
                const uploaded = await this.driveService.uploadFile(
                    xmlBuffer,
                    `${claveAcceso}.xml`,
                    'text/xml',
                    carpetaPending,
                );
                driveFileIdPrevio = uploaded.id ?? null;
            } catch (driveErr) {
                // Drive falló — continuamos igual, el XML no se guardó
                this.logger.warn(`⚠️ No se pudo guardar XML previo en Drive: ${driveErr}`);
            }

            // ── NUEVO: Guardar factura en BD con PENDIENTE antes de enviar ────
            await this.guardarFactura({
                ventaId,
                claveAcceso,
                estadoCodigo: 'PENDIENTE',
                mensajeSRI: 'Enviando al SRI...',
                fechaEnvio: new Date(),
                fechaAutorizacion: null,
                xmlDriveId: driveFileIdPrevio, // ← XML con fecha original
                usuarioEmisorId: user.sub,
                ambiente: Number(ambiente),
            });

            // Marcar número OCUPADO (número llegará al SRI en instantes)
            await this.numberHelper.marcarNumeroOcupado(sucursal.sucursales_id, numero);

            // ── Enviar al SRI ────────────────────────────────────────────────
            const fechaEnvio = new Date();
            let respuestaEnvio: string;

            try {
                respuestaEnvio = await this.sriService.enviarComprobante(xmlFirmado);
            } catch (sriErr) {
                // SRI completamente caído (timeout, connection refused, etc.)
                this.logger.error(`❌ SRI no disponible: ${sriErr}`);

                // Actualizar estado a PENDIENTE con mensaje descriptivo
                await this.actualizarEstadoFactura(ventaId, 'PENDIENTE',
                    'SRI no disponible al momento del envío. Pendiente de reenvío.',
                    fechaEnvio, driveFileIdPrevio,
                );

                return {
                    claveAcceso,
                    estado: 'PENDIENTE',
                    mensajeSRI: 'SRI no disponible. La factura quedó pendiente de envío. Puede reintentarse desde el módulo de facturas.',
                    fechaAutorizacion: null,
                };
            }

            // ── Procesar respuesta del SRI ───────────────────────────────────
            const parsedEnvio = await parseStringPromise(respuestaEnvio, { explicitArray: false });
            const estadoEnvio =
                parsedEnvio['soap:Envelope']?.['soap:Body']?.[
                    'ns2:validarComprobanteResponse'
                ]?.RespuestaRecepcionComprobante?.estado;

            let resultado: GenerateInvoiceResponseDto;

            if (estadoEnvio === 'RECIBIDA') {
                const consultaXml = await this.sriService.consultarEstado(claveAcceso);

                const { estado, mensajeCompleto, fechaAutorizacion, driveFileId } =
                    await this.sriService.procesarRespuestaAutorizacion(
                        consultaXml, empresaId, claveAcceso,
                    );

                // Actualizar con resultado final — reemplaza el PENDIENTE inicial
                await this.actualizarEstadoFactura(
                    ventaId, estado, mensajeCompleto,
                    fechaEnvio, driveFileId,
                    fechaAutorizacion ? new Date(fechaAutorizacion) : null,
                );

                await this.numberHelper.marcarNumeroUsado(sucursal.sucursales_id, numero);

                // Limpiar XML de pendiente_envio si se autorizó
                if (driveFileIdPrevio && estado === 'AUTORIZADO') {
                    this.driveService.deleteFile(driveFileIdPrevio).catch(() => { });
                }

                resultado = { claveAcceso, estado, mensajeSRI: mensajeCompleto, fechaAutorizacion };

            } else {
                const { estado, mensajeCompleto, driveFileId } =
                    await this.sriService.procesarRespuestaDevuelta(
                        respuestaEnvio, xmlFirmado, empresaId, claveAcceso,
                    );

                await this.actualizarEstadoFactura(
                    ventaId, estado, mensajeCompleto, fechaEnvio, driveFileId,
                );

                await this.numberHelper.marcarNumeroUsado(sucursal.sucursales_id, numero);

                resultado = { claveAcceso, estado, mensajeSRI: mensajeCompleto, fechaAutorizacion: null };
            }

            return resultado;

        } catch (error) {
            this.logger.error('❌ Error generando factura:', error);

            if (numero !== null) {
                try {
                    const sucursal = await this.prisma.sucursal.findFirst({
                        where: { sucursales_empresaId: empresaId, sucursales_nombre: 'MATRIZ' },
                        select: { sucursales_id: true },
                    });
                    if (sucursal) {
                        await this.numberHelper.liberarNumeroFactura(sucursal.sucursales_id, numero);
                    }
                } catch (libErr) {
                    this.logger.error('Error liberando número:', libErr);
                }
            }

            return {
                claveAcceso: '',
                estado: 'ERROR',
                mensajeSRI: 'Error interno al generar la factura.',
                fechaAutorizacion: null,
            };
        }
    }

    // ── Helper: actualizar estado sin crear duplicado ────────────────────
    private async actualizarEstadoFactura(
        ventaId: number,
        estadoCodigo: string,
        mensajeSRI: string,
        fechaEnvio: Date,
        xmlDriveId: string | null,
        fechaAutorizacion: Date | null = null,
    ): Promise<void> {
        const estadoSri = await this.prisma.estadoSri.findFirst({
            where: { codigo: estadoCodigo },
            select: { estado_sri_id: true },
        });

        await this.prisma.factura.upsert({
            where: { venta_id: ventaId },
            create: {
                venta_id: ventaId,
                clave_acceso: '', // se actualiza abajo
                estado_sri_id: estadoSri?.estado_sri_id ?? null,
                mensaje_sri: mensajeSRI,
                fecha_envio_sri: fechaEnvio,
                fecha_autorizacion: fechaAutorizacion,
                id_xml: xmlDriveId,
                ambiente: Number(this.config.get('INVOICE_SRI_ENVIRONMENT_TYPE')),
                usuario_emisor_id: 0,
            },
            update: {
                estado_sri_id: estadoSri?.estado_sri_id ?? null,
                mensaje_sri: mensajeSRI,
                fecha_envio_sri: fechaEnvio,
                fecha_autorizacion: fechaAutorizacion,
                ...(xmlDriveId && { id_xml: xmlDriveId }),
            },
        });
    }





    // ── Guardar/actualizar factura en BD ─────────────────────────────────
    private async guardarFactura(data: {
        ventaId: number;
        claveAcceso: string;
        estadoCodigo: string;
        mensajeSRI: string;
        fechaEnvio: Date;
        fechaAutorizacion: Date | null;
        xmlDriveId: string | null;
        usuarioEmisorId: number;
        ambiente: number;
    }): Promise<void> {
        const estadoSri = await this.prisma.estadoSri.findFirst({
            where: { codigo: data.estadoCodigo },
            select: { estado_sri_id: true },
        });

        if (!estadoSri) {
            this.logger.warn(`⚠️ Estado SRI "${data.estadoCodigo}" no encontrado en BD`);
        }

        // upsert: si ya existe por venta_id o clave_acceso, actualiza
        await this.prisma.factura.upsert({
            where: { venta_id: data.ventaId },
            create: {
                venta_id: data.ventaId,
                clave_acceso: data.claveAcceso,
                estado_sri_id: estadoSri?.estado_sri_id ?? null,
                mensaje_sri: data.mensajeSRI,
                fecha_envio_sri: data.fechaEnvio,
                fecha_autorizacion: data.fechaAutorizacion,
                id_xml: data.xmlDriveId,
                ambiente: data.ambiente,
                usuario_emisor_id: data.usuarioEmisorId,
            },
            update: {
                estado_sri_id: estadoSri?.estado_sri_id ?? null,
                mensaje_sri: data.mensajeSRI,
                fecha_envio_sri: data.fechaEnvio,
                fecha_autorizacion: data.fechaAutorizacion,
                id_xml: data.xmlDriveId,
                ambiente: data.ambiente,
                usuario_emisor_id: data.usuarioEmisorId,
            },
        });
    }
    // ────────────────────────────────────────────────────────────────────────
    // LIST
    // ────────────────────────────────────────────────────────────────────────
    async listFacturas(
        dto: ListFacturasBodyDto,
        user: JwtPayload,
    ): Promise<ListFacturasResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        const { search, estado, fechaDesde, fechaHasta, page = 0, limit = 10 } = dto;
        const term = search?.trim();

        // ── Where ────────────────────────────────────────────────────────────
        const where: Prisma.FacturaWhereInput = {
            venta: {
                empresa_id: empresaId,

                ...(fechaDesde || fechaHasta
                    ? {
                        fecha_emision: {
                            ...(fechaDesde && { gte: toGuayaquilStartOfDay(fechaDesde) }),
                            ...(fechaHasta && { lte: toGuayaquilEndOfDay(fechaHasta) }),
                        },
                    }
                    : {}),
            },

            // Estado SRI
            ...(estado?.trim()
                ? { estadoSri: { codigo: estado.trim() } }
                : {}),

            // Búsqueda: número de venta O clave de acceso O cliente
            ...(term
                ? {
                    OR: [
                        { clave_acceso: { contains: term, mode: 'insensitive' } },
                        { venta: { numero_venta: { contains: term, mode: 'insensitive' } } },
                        { venta: { cliente: { razon_social: { contains: term, mode: 'insensitive' } } } },
                    ],
                }
                : {}),
        };

        // ── Paralelo: count + data + estados catálogo ─────────────────────────
        const [total, rows, estados] = await Promise.all([
            this.prisma.factura.count({ where }),

            this.prisma.factura.findMany({
                where,
                orderBy: { fecha_creacion: 'desc' },
                skip: page * limit,
                take: limit,
                select: {
                    factura_id: true,
                    venta_id: true,
                    clave_acceso: true,
                    mensaje_sri: true,
                    fecha_envio_sri: true,
                    fecha_autorizacion: true,
                    id_xml: true,
                    ambiente: true,
                    estadoSri: { select: { codigo: true } },
                    venta: {
                        select: {
                            numero_venta: true,
                            total: true,
                            fecha_emision: true,
                            cliente: {
                                select: { razon_social: true, identificacion: true },
                            },
                        },
                    },
                },
            }),

            this.catalogosService.getEstadosSri(), // ← catálogo reutilizado
        ]);

        const facturas: FacturaListItemDto[] = rows.map((f) => ({
            factura_id: f.factura_id,
            venta_id: f.venta_id,
            numero_venta: f.venta.numero_venta,
            cliente: f.venta.cliente.razon_social,
            identificacion: f.venta.cliente.identificacion,
            fecha_emision: f.venta.fecha_emision,
            total: Number(f.venta.total),
            estado: f.estadoSri?.codigo ?? 'SIN ESTADO',
            fecha_autorizacion: f.fecha_autorizacion,
            fecha_envio_sri: f.fecha_envio_sri,
            ambiente: f.ambiente ?? 2,
            clave_acceso: f.clave_acceso,
            tiene_xml: !!f.id_xml,
            mensaje_sri: f.mensaje_sri,
        }));

        return { total, facturas, estados };
    }

    // ────────────────────────────────────────────────────────────────────────
    // SYNC
    // ────────────────────────────────────────────────────────────────────────
    async syncFactura(
        dto: SyncFacturaBodyDto,
        user: JwtPayload,
    ): Promise<SyncFacturaResponseDto> {
        const empresaId = user.empresaId;
        if (!empresaId) throw new UnauthorizedException();

        // ── 1. Obtener factura — verificar que pertenece a la empresa ─────────
        const factura = await this.prisma.factura.findFirst({
            where: {
                factura_id: dto.factura_id,
                venta: { empresa_id: empresaId },
            },
            select: {
                factura_id: true,
                clave_acceso: true,
                id_xml: true,
                ambiente: true,
                venta_id: true,
                usuario_emisor_id: true,
                estadoSri: { select: { codigo: true } },
                venta: { select: { empresa_id: true } },
            },
        });

        if (!factura) throw new NotFoundException('Factura no encontrada');

        const estadoAnterior = factura.estadoSri?.codigo ?? 'SIN ESTADO';

        // ── 2. Consultar estado actual en el SRI ──────────────────────────────
        this.logger.log(`🔄 Sincronizando factura ${factura.factura_id} — clave: ${factura.clave_acceso}`);

        const consultaXml = await this.sriService.consultarEstado(factura.clave_acceso);

        if (!consultaXml) {
            return {
                factura_id: factura.factura_id,
                estadoAnterior,
                estadoNuevo: estadoAnterior,
                cambio: false,
                mensajeSRI: 'SRI no respondió en tiempo',
                fechaAutorizacion: null,
                xmlActualizado: false,
            };
        }

        // ── 3. Procesar respuesta ─────────────────────────────────────────────
        const { estado, mensajeCompleto, fechaAutorizacion, driveFileId } =
            await this.sriService.procesarRespuestaAutorizacion(
                consultaXml,
                empresaId,
                factura.clave_acceso,
            );

        const cambio = estado !== estadoAnterior;
        let xmlActualizado = false;

        // ── 4. Actualizar BD si cambió el estado O si el XML estaba perdido ───
        const xmlPerdido = !factura.id_xml && !!driveFileId;
        const debeActualizar = cambio || xmlPerdido;

        if (debeActualizar) {
            const estadoSriRecord = await this.prisma.estadoSri.findFirst({
                where: { codigo: estado },
                select: { estado_sri_id: true },
            });

            await this.prisma.factura.update({
                where: { factura_id: factura.factura_id },
                data: {
                    ...(estadoSriRecord && { estado_sri_id: estadoSriRecord.estado_sri_id }),
                    mensaje_sri: mensajeCompleto || factura.estadoSri?.codigo,
                    fecha_autorizacion: fechaAutorizacion ? new Date(fechaAutorizacion) : undefined,
                    // Actualizar id_xml si llegó uno nuevo (XML perdido o reemplazado)
                    ...(driveFileId && { id_xml: driveFileId }),
                },
            });

            if (xmlPerdido || (driveFileId && driveFileId !== factura.id_xml)) {
                xmlActualizado = true;
                this.logger.log(
                    xmlPerdido
                        ? `📂 XML recuperado para factura ${factura.factura_id}`
                        : `📂 XML actualizado para factura ${factura.factura_id}`,
                );
            }

            if (cambio) {
                this.logger.log(
                    `✅ Estado actualizado: ${estadoAnterior} → ${estado} (factura ${factura.factura_id})`,
                );
            }
        }

        return {
            factura_id: factura.factura_id,
            estadoAnterior,
            estadoNuevo: estado,
            cambio,
            mensajeSRI: mensajeCompleto || null,
            fechaAutorizacion: fechaAutorizacion || null,
            xmlActualizado,
        };
    }


    async retryFactura(
        dto: RetryFacturaBodyDto,
        user: JwtPayload,
    ): Promise<RetryFacturaResponseDto> {
        const empresaId = user.empresaId!;
        const ambiente = this.config.getOrThrow<string>('INVOICE_SRI_ENVIRONMENT_TYPE');

        // ── 1. Obtener factura — solo PENDIENTE o DEVUELTA ───────────────────
        const factura = await this.prisma.factura.findFirst({
            where: {
                factura_id: dto.factura_id,
                venta: { empresa_id: empresaId },
                estadoSri: { codigo: { in: ['PENDIENTE', 'DEVUELTA'] } },
            },
            select: {
                factura_id: true,
                clave_acceso: true,
                id_xml: true,
                ambiente: true,
                venta_id: true,
                usuario_emisor_id: true,
            },
        });

        if (!factura) {
            throw new BadRequestException(
                'Factura no encontrada o no está en estado reintentable',
            );
        }

        // ── 2. Verificar si es el mismo día ──────────────────────────────────
        // La fecha está en la clave de acceso posiciones 0-7: ddmmaaaa
        const fechaEnClave = factura.clave_acceso.substring(0, 8); // ej: "27052026"
        const hoy = this.getFechaFormateada();            // ej: "28052026"
        const esMismodia = fechaEnClave === hoy;

        this.logger.log(
            `🔄 Retry factura ${factura.factura_id} — ` +
            `fecha original: ${fechaEnClave}, hoy: ${hoy}, ` +
            `${esMismodia ? 'mismo día → XML original' : 'día diferente → RECREAR'}`,
        );

        const fechaEnvio = new Date();

        if (esMismodia) {
            // ── CASO A: Mismo día → enviar XML original ──────────────────────
            return this.enviarXmlOriginal(factura, empresaId, fechaEnvio);

        } else {
            // ── CASO B: Día diferente → recrear con fecha de hoy ────────────
            return this.recrearYEnviarFactura(factura, user, empresaId, ambiente, fechaEnvio);
        }
    }

    // ── CASO A: Enviar XML original (mismo día) ──────────────────────────
    private async enviarXmlOriginal(
        factura: any,
        empresaId: number,
        fechaEnvio: Date,
    ): Promise<RetryFacturaResponseDto> {

        if (!factura.id_xml) {
            throw new BadRequestException(
                'No hay XML guardado. El envío original falló antes de guardar el XML.',
            );
        }

        let xmlFirmado: string;
        try {
            const buffer = await this.driveService.getFileBinary(factura.id_xml);
            xmlFirmado = buffer.toString('utf-8');
        } catch {
            throw new BadRequestException('No se pudo leer el XML desde Drive.');
        }

        return this.enviarAlSri(
            xmlFirmado, factura.clave_acceso, factura.venta_id,
            empresaId, fechaEnvio, factura.id_xml, true,
        );
    }

    // ── CASO B: Recrear factura con fecha de hoy ─────────────────────────
    private async recrearYEnviarFactura(
        factura: any,
        user: JwtPayload,
        empresaId: number,
        ambiente: string,
        fechaEnvio: Date,
    ): Promise<RetryFacturaResponseDto> {

        this.logger.log(
            `📅 Recreando factura ${factura.factura_id} con fecha de hoy`,
        );

        // ── Cargar todos los datos necesarios para recrear ───────────────────
        const venta = await this.prisma.venta.findUniqueOrThrow({
            where: { venta_id: factura.venta_id },
            select: {
                venta_id: true,
                numero_venta: true,
                fecha_emision: true, // fecha original de la VENTA (no cambia)
                subtotal: true,
                descuento_total: true,
                iva: true,
                propina: true,
                total: true,
                observaciones: true,
                plazo_pago: true,
                tipo_comprobante_id: true,
                forma_pago_id: true,
                ventas_sucursales_id: true,
                cliente: {
                    select: {
                        identificacion: true,
                        tipo_identificacion: true,
                        razon_social: true,
                        direccion: true,
                        email: true,
                        telefono: true,
                        camposAdicionales: { select: { clave: true, valor: true } },
                    },
                },
                detalles: {
                    select: {
                        cantidad: true,
                        precio_unitario: true,
                        descuento: true,
                        tarifa_impuesto_id: true,
                        lote: {
                            select: {
                                item: {
                                    select: {
                                        item_codigo_principal: true,
                                        item_codigo_auxiliar: true,
                                        item_nombre: true,
                                        tarifaImpuesto: {
                                            select: {
                                                tarifa_codigo_sri: true,
                                                tarifa_porcentaje: true,
                                                tipoImpuesto: {
                                                    select: { tipo_impuesto_codigo_sri: true },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        item: {
                            select: {
                                item_codigo_principal: true,
                                item_codigo_auxiliar: true,
                                item_nombre: true,
                                tarifaImpuesto: {
                                    select: {
                                        tarifa_codigo_sri: true,
                                        tarifa_porcentaje: true,
                                        tipoImpuesto: {
                                            select: { tipo_impuesto_codigo_sri: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Datos empresa y sucursal
        const usuarioEmpresa = await this.prisma.usuarioEmpresa.findFirstOrThrow({
            where: {
                usuario_empresa_usuarioId: user.sub,
                usuario_empresa_empresaId: empresaId,
            },
            select: {
                usuario_empresa_codEmi: true,
                empresa: {
                    select: {
                        empresas_razonSocial: true,
                        empresas_nombreComercial: true,
                        empresas_ruc: true,
                        empresas_dirMatriz: true,
                        empresas_telefono: true,
                        empresa_email: true,
                        empresas_obligadocontabilidad: true,
                        empresas_agenteRetencion: true,
                        regimen: { select: { regimenes_nombre: true } },
                    },
                },
            },
        });

        const sucursal = await this.prisma.sucursal.findFirstOrThrow({
            where: { sucursales_id: venta.ventas_sucursales_id! },
            select: {
                sucursales_id: true,
                sucursales_cod: true,
                sucursales_direccion: true,
            },
        });

        const tipoComprobante = await this.prisma.tipoComprobante.findUniqueOrThrow({
            where: { tipo_comprobante_id: venta.tipo_comprobante_id },
            select: { codigo: true },
        });

        const formaPago = await this.prisma.formaPago.findUniqueOrThrow({
            where: { forma_pago_id: venta.forma_pago_id },
            select: { codigo: true },
        });

        // ── Extraer número del secuencial de la clave anterior ───────────────
        // La clave tiene: ddmmaaaa + tipoDoc(2) + ruc(13) + ambiente(1) +
        //                 serie(6) + secuencial(9) + codigoNumerico(8) + tipoEmision(1)
        const claveAnterior = factura.clave_acceso; // 49 dígitos
        const secuencialViejo = claveAnterior.substring(24, 33); // posición 24-32, 9 dígitos
        const numeroSecuencial = parseInt(secuencialViejo, 10);

        // ── Nueva clave de acceso con fecha de HOY ───────────────────────────
        const serie = `${sucursal.sucursales_cod}${usuarioEmpresa.usuario_empresa_codEmi}`;
        const nuevaClaveAcceso = generarClaveAccesoFactura(
            usuarioEmpresa.empresa.empresas_ruc,
            ambiente,
            serie,
            numeroSecuencial, // mismo número de secuencial
        );

        this.logger.log(
            `🔑 Nueva clave acceso (fecha hoy): ${nuevaClaveAcceso}\n` +
            `🔑 Clave anterior (fecha original): ${claveAnterior}`,
        );

        // ── Construir detalles para el XML ────────────────────────────────────
        const detallesXml = venta.detalles.map((d) => {
            const itemData = d.lote?.item ?? d.item!;
            const cantidad = Number(d.cantidad);
            const precio = Number(d.precio_unitario);
            const descuento = Number(d.descuento);
            const base = cantidad * precio - descuento;
            const porcentaje = Number(itemData.tarifaImpuesto?.tarifa_porcentaje ?? 0);
            const valorIva = parseFloat((base * porcentaje / 100).toFixed(2));

            return {
                codigoPrincipal: itemData.item_codigo_principal,
                codigoAuxiliar: itemData.item_codigo_auxiliar ?? undefined,
                descripcion: itemData.item_nombre,
                cantidad,
                precioUnitario: precio,
                descuento,
                precioTotalSinImpuesto: base,
                impuestos: [{
                    codigo: itemData.tarifaImpuesto?.tipoImpuesto?.tipo_impuesto_codigo_sri ?? '2',
                    codigoPorcentaje: itemData.tarifaImpuesto?.tarifa_codigo_sri ?? '0',
                    baseImponible: base,
                    tarifa: porcentaje,
                    valor: valorIva,
                }],
            };
        });

        // ── Campos adicionales ───────────────────────────────────────────────
        const camposAdicionales = [
            { nombre: 'Observaciones', valor: venta.observaciones ?? '' },
            { nombre: 'Email', valor: venta.cliente.email ?? '' },
            { nombre: 'Teléfono', valor: venta.cliente.telefono ?? '' },
            { nombre: 'Dirección', valor: venta.cliente.direccion ?? '' },
            ...venta.cliente.camposAdicionales.map((c) => ({
                nombre: c.clave, valor: c.valor,
            })),
        ].filter((c) => c.valor.trim() !== '');

        // ── Generar nuevo XML con fecha HOY ───────────────────────────────────
        const empresa = usuarioEmpresa.empresa;
        const xmlString = generarXMLFactura({
            ambiente,
            tipoEmision: '1',
            razonSocial: empresa.empresas_razonSocial,
            nombreComercial: empresa.empresas_nombreComercial ?? '',
            ruc: empresa.empresas_ruc,
            claveAcceso: nuevaClaveAcceso,
            codDoc: tipoComprobante.codigo,
            estab: sucursal.sucursales_cod,
            ptoEmi: usuarioEmpresa.usuario_empresa_codEmi,
            secuencial: numeroSecuencial.toString().padStart(9, '0'),
            dirMatriz: empresa.empresas_dirMatriz,
            regimenMicroempresas: empresa.regimen?.regimenes_nombre ?? 'NO',
            agenteRetencion: empresa.empresas_agenteRetencion,
            // ← FECHA DE HOY — correcto para el SRI
            fechaEmision: moment().format('DD/MM/YYYY'),
            dirEstablecimiento: sucursal.sucursales_direccion,
            obligadoContabilidad: empresa.empresas_obligadocontabilidad,
            tipoIdentificacionComprador: venta.cliente.tipo_identificacion,
            razonSocialComprador: venta.cliente.razon_social,
            identificacionComprador: venta.cliente.identificacion,
            totalSinImpuestos: Number(venta.subtotal),
            totalDescuento: Number(venta.descuento_total),
            propina: Number(venta.propina),
            importeTotal: Number(venta.total),
            moneda: 'DOLAR',
            pagoFormaPago: formaPago.codigo,
            pagoTotal: Number(venta.total),
            unidadTiempo: '',
            plazo: venta.plazo_pago ?? '',
            detalles: detallesXml,
            camposAdicionales,
        });

        // ── Firmar nuevo XML ──────────────────────────────────────────────────
        const xmlFirmado = await this.signerHelper.firmarXML(empresaId, xmlString);

        // ── Actualizar clave de acceso en BD ANTES de enviar ─────────────────
        await this.prisma.factura.update({
            where: { factura_id: factura.factura_id },
            data: {
                clave_acceso: nuevaClaveAcceso,
                mensaje_sri: 'Factura recreada con fecha actual. Enviando al SRI...',
            },
        });

        // ── Guardar nuevo XML en Drive ────────────────────────────────────────
        let nuevoDriveId: string | null = null;
        try {
            const uploaded = await this.driveService.uploadFile(
                Buffer.from(xmlFirmado, 'utf-8'),
                `${nuevaClaveAcceso}.xml`,
                'text/xml',
                `${empresaId}/facturas/pendiente_envio`,
            );
            nuevoDriveId = uploaded.id ?? null;

            // Eliminar XML anterior (fecha vieja) para no generar confusión
            if (factura.id_xml) {
                this.driveService.deleteFile(factura.id_xml).catch(() => { });
            }
        } catch (err) {
            this.logger.warn(`⚠️ No se pudo guardar XML recreado en Drive: ${err}`);
        }

        // Actualizar id_xml con el nuevo
        if (nuevoDriveId) {
            await this.prisma.factura.update({
                where: { factura_id: factura.factura_id },
                data: { id_xml: nuevoDriveId },
            });
        }

        // ── Enviar al SRI ─────────────────────────────────────────────────────
        return this.enviarAlSri(
            xmlFirmado, nuevaClaveAcceso, factura.venta_id,
            empresaId, fechaEnvio, nuevoDriveId, false,
        );
    }

    // ── Helper compartido: enviar XML al SRI y procesar respuesta ────────
    private async enviarAlSri(
        xmlFirmado: string,
        claveAcceso: string,
        ventaId: number,
        empresaId: number,
        fechaEnvio: Date,
        xmlDriveId: string | null,
        xmlOriginal: boolean,
    ): Promise<RetryFacturaResponseDto> {

        let respuestaEnvio: string;
        try {
            respuestaEnvio = await this.sriService.enviarComprobante(xmlFirmado);
        } catch (sriErr) {
            this.logger.error(`❌ SRI no disponible: ${sriErr}`);
            throw new BadRequestException(
                'El SRI no responde. Intente más tarde.',
            );
        }

        const parsedEnvio = await parseStringPromise(respuestaEnvio, { explicitArray: false });
        const estadoEnvio =
            parsedEnvio['soap:Envelope']?.['soap:Body']?.[
                'ns2:validarComprobanteResponse'
            ]?.RespuestaRecepcionComprobante?.estado;

        if (estadoEnvio === 'RECIBIDA') {
            const consultaXml = await this.sriService.consultarEstado(claveAcceso);

            const { estado, mensajeCompleto, fechaAutorizacion, driveFileId } =
                await this.sriService.procesarRespuestaAutorizacion(
                    consultaXml, empresaId, claveAcceso,
                );

            await this.actualizarEstadoFactura(
                ventaId, estado, mensajeCompleto, fechaEnvio,
                driveFileId ?? xmlDriveId,
                fechaAutorizacion ? new Date(fechaAutorizacion) : null,
            );

            if (driveFileId && driveFileId !== xmlDriveId && xmlDriveId) {
                this.driveService.deleteFile(xmlDriveId).catch(() => { });
            }

            return {
                estado,
                claveAcceso,
                mensajeSRI: mensajeCompleto,
                fechaAutorizacion: fechaAutorizacion,
                xml_original_usado: xmlOriginal,
            };

        } else {
            const { estado, mensajeCompleto, driveFileId } =
                await this.sriService.procesarRespuestaDevuelta(
                    respuestaEnvio, xmlFirmado, empresaId, claveAcceso,
                );

            await this.actualizarEstadoFactura(
                ventaId, estado, mensajeCompleto,
                fechaEnvio, driveFileId ?? xmlDriveId,
            );

            return {
                estado,
                claveAcceso,
                mensajeSRI: mensajeCompleto,
                fechaAutorizacion: null,
                xml_original_usado: xmlOriginal,
            };
        }
    }

    // ── Helper: fecha hoy en formato ddmmaaaa ─────────────────────────────
    private getFechaFormateada(): string {
        const hoy = new Date();
        const dd = String(hoy.getDate()).padStart(2, '0');
        const mm = String(hoy.getMonth() + 1).padStart(2, '0');
        const yyyy = hoy.getFullYear();
        return `${dd}${mm}${yyyy}`;
    }
}
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

            // ── 12. Marcar OCUPADO antes de enviar — si el proceso muere aquí
            //        el número no se reutiliza (SRI podría haberlo recibido)
            await this.numberHelper.marcarNumeroOcupado(sucursal.sucursales_id, numero);

            // ── 13. Enviar al SRI ────────────────────────────────────────────────
            const respuestaEnvio = await this.sriService.enviarComprobante(xmlFirmado);
            const fechaEnvio = new Date();

            const parsedEnvio = await parseStringPromise(respuestaEnvio, { explicitArray: false });
            const estadoEnvio =
                parsedEnvio['soap:Envelope']?.['soap:Body']?.[
                    'ns2:validarComprobanteResponse'
                ]?.RespuestaRecepcionComprobante?.estado;

            let resultado: GenerateInvoiceResponseDto;

            if (estadoEnvio === 'RECIBIDA') {
                // ── RECIBIDA → consultar autorización ───────────────────────────
                const consultaXml = await this.sriService.consultarEstado(claveAcceso);

                const { estado, mensajeCompleto, fechaAutorizacion, driveFileId } =
                    await this.sriService.procesarRespuestaAutorizacion(
                        consultaXml, empresaId, claveAcceso,
                    );

                await this.guardarFactura({
                    ventaId, claveAcceso, estadoCodigo: estado,
                    mensajeSRI: mensajeCompleto, fechaEnvio,
                    fechaAutorizacion: fechaAutorizacion ? new Date(fechaAutorizacion) : null,
                    xmlDriveId: driveFileId, usuarioEmisorId: user.sub, ambiente: Number(ambiente),
                });

                // AUTORIZADO o NO AUTORIZADO → USADO (número consumido en SRI)
                await this.numberHelper.marcarNumeroUsado(sucursal.sucursales_id, numero);

                resultado = { claveAcceso, estado, mensajeSRI: mensajeCompleto, fechaAutorizacion };

            } else {
                // ── DEVUELTA ─────────────────────────────────────────────────────
                const { estado, mensajeCompleto, driveFileId } =
                    await this.sriService.procesarRespuestaDevuelta(
                        respuestaEnvio, xmlFirmado, empresaId, claveAcceso,
                    );

                await this.guardarFactura({
                    ventaId, claveAcceso, estadoCodigo: estado,
                    mensajeSRI: mensajeCompleto, fechaEnvio,
                    fechaAutorizacion: null, xmlDriveId: driveFileId,
                    usuarioEmisorId: user.sub, ambiente: Number(ambiente),
                });

                // ← SIEMPRE marcar USADO en DEVUELTA
                // "ERROR SECUENCIAL REGISTRADO" = SRI ya tiene ese número → no reutilizar
                // Otros errores DEVUELTA = XML inválido → el número sí llegó al SRI
                await this.numberHelper.marcarNumeroUsado(sucursal.sucursales_id, numero);

                resultado = { claveAcceso, estado, mensajeSRI: mensajeCompleto, fechaAutorizacion: null };
            }

            return resultado;

        } catch (error) {
            this.logger.error('❌ Error generando factura:', error);

            // Solo liberar si el número está RESERVADO (nunca llegó al SRI)
            // Si está OCUPADO = ya se envió, no liberar
            if (numero !== null) {
                try {
                    const sucursal = await this.prisma.sucursal.findFirst({
                        where: { sucursales_empresaId: empresaId, sucursales_nombre: 'MATRIZ' },
                        select: { sucursales_id: true },
                    });
                    if (sucursal) {
                        // liberarNumeroFactura solo actualiza si estado = RESERVADO
                        await this.numberHelper.liberarNumeroFactura(sucursal.sucursales_id, numero);
                    }
                } catch (libErr) {
                    this.logger.error('Error liberando número:', libErr);
                }
            }

            return {
                claveAcceso: '',
                estado: 'ERROR',
                mensajeSRI: 'No se envió la factura al SRI.',
                fechaAutorizacion: null,
            };
        }
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
}
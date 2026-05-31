import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { PrintSaleBodyDto } from './dto/request/print-sale-body.dto';
import type { PdfResponseDto } from './dto/response/pdf-response.dto';
import { parsearXmlAutorizado } from './helpers/shared/xml-parser.helper';
import { generateTicketFactura } from './helpers/ticket/ticket-factura.template';
import { generateTicketComprobante } from './helpers/ticket/ticket-comprobante.template';
import { generateA4Factura } from './helpers/a4/a4-factura.template';
import { generateA4Comprobante } from './helpers/a4/a4-comprobante.template';

// Select solo para comprobantes (sin factura electrónica)
const VENTA_SELECT_BD = {
    venta_id: true,
    numero_venta: true,
    fecha_emision: true,
    subtotal: true,
    descuento_total: true,
    iva: true,
    propina: true,
    total: true,
    observaciones: true,
    plazo_pago: true,
    empresa: {
        select: {
            empresas_razonSocial: true,
            empresas_nombreComercial: true,
            empresas_ruc: true,
            empresas_dirMatriz: true,
            empresas_telefono: true,
            empresa_email: true,
        },
    },
    cliente: {
        select: {
            razon_social: true,
            identificacion: true,
            tipo_identificacion: true,
            direccion: true,
            telefono: true,
            email: true,
            camposAdicionales: { select: { clave: true, valor: true } },
        },
    },
    tipoComprobante: { select: { nombre: true } },
    formaPago: { select: { nombre: true } },
    detalles: {
        select: {
            cantidad: true,
            precio_unitario: true,
            descuento: true,
            lote: { select: { item: { select: { item_codigo_principal: true, item_nombre: true } } } },
            item: { select: { item_codigo_principal: true, item_nombre: true } },
        },
    },
    // Solo necesitamos saber si tiene factura y el id_xml
    factura: {
        select: {
            id_xml: true,
            clave_acceso: true,
            ambiente: true,
            fecha_autorizacion: true,
            estadoSri: { select: { codigo: true } },
        },
    },
} as const;

@Injectable()
export class PdfService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly driveService: GoogleDriveService,
    ) { }

    private async fetchVenta(id: number, empresaId: number) {
        const venta = await this.prisma.venta.findFirst({
            where: { venta_id: id, empresa_id: empresaId },
            select: VENTA_SELECT_BD,
        });
        if (!venta) throw new NotFoundException('Venta no encontrada');
        return venta;
    }

    // ── Construir objeto para templates desde XML ────────────────────────
    private buildVentaDesdeXml(xmlData: any, facturaDb: any) {
        return {
            // Empresa desde XML (datos al momento de emitir)
            empresa: {
                empresas_razonSocial: xmlData.razonSocial,
                empresas_nombreComercial: xmlData.nombreComercial,
                empresas_ruc: xmlData.ruc,
                empresas_dirMatriz: xmlData.dirMatriz,
                empresas_telefono: '—', // no está en el XML base
                empresa_email: '—',
            },

            // Comprobante
            numero_venta: xmlData.numeroVenta,
            fecha_emision: xmlData.fechaEmision,

            // Cliente desde XML (datos al momento de emitir)
            cliente: {
                razon_social: xmlData.razonSocialComprador,
                identificacion: xmlData.identificacionComprador,
                tipo_identificacion: xmlData.tipoIdentificacionComprador,
                direccion: xmlData.direccionComprador,
                telefono: xmlData.telefonoComprador,
                email: xmlData.emailComprador,
                camposAdicionales: xmlData.camposAdicionales, // desde infoAdicional del XML
            },

            tipoComprobante: { nombre: 'FACTURA' },
            formaPago: { nombre: xmlData.formaPago },
            plazo_pago: xmlData.plazo,
            observaciones: xmlData.camposAdicionales
                .find((c: any) => c.clave.toLowerCase() === 'observaciones')?.valor ?? '',

            // Totales desde XML
            subtotal: xmlData.totalSinImpuestos,
            descuento_total: xmlData.totalDescuento,
            iva: xmlData.iva,
            propina: xmlData.propina,
            total: xmlData.importeTotal,

            // Detalles desde XML
            detalles: xmlData.detalles.map((d: any) => ({
                cantidad: d.cantidad,
                precio_unitario: d.precioUnitario,
                descuento: d.descuento,
                lote: null,
                item: {
                    item_codigo_principal: d.codigoPrincipal,
                    item_nombre: d.descripcion,
                },
            })),

            // Factura con estado de BD (autorización es de BD/XML autorizado)
            factura: {
                clave_acceso: xmlData.claveAcceso,
                ambiente: xmlData.ambiente,
                fecha_autorizacion: xmlData.fechaAutorizacion,
                estadoSri: { codigo: xmlData.estadoSri },
            },
        };
    }

    // ── Ticket ───────────────────────────────────────────────────────────
    async ticketPDF(dto: PrintSaleBodyDto, user: JwtPayload): Promise<PdfResponseDto> {
        if (!user.empresaId) throw new UnauthorizedException();

        const venta = await this.fetchVenta(dto.id, user.empresaId);

        let base64: string;

        if (venta.factura?.id_xml) {
            // ── FACTURA: leer desde XML de Drive ───────────────────────────
            const xmlBuffer = await this.driveService.getFileBinary(venta.factura.id_xml);
            const xmlContent = xmlBuffer.toString('utf-8');
            const xmlData = await parsearXmlAutorizado(xmlContent);
            const ventaXml = this.buildVentaDesdeXml(xmlData, venta.factura);
            base64 = await generateTicketFactura(ventaXml);

        } else {
            // ── COMPROBANTE: leer desde BD ─────────────────────────────────
            base64 = await generateTicketComprobante(venta);
        }

        return { base64 };
    }

    // ── A4 ───────────────────────────────────────────────────────────────
    async a4PDF(dto: PrintSaleBodyDto, user: JwtPayload): Promise<PdfResponseDto> {
        if (!user.empresaId) throw new UnauthorizedException();

        const venta = await this.fetchVenta(dto.id, user.empresaId);

        let base64: string;

        if (venta.factura?.id_xml) {
            // ── FACTURA: leer desde XML de Drive ───────────────────────────
            const xmlBuffer = await this.driveService.getFileBinary(venta.factura.id_xml);
            const xmlContent = xmlBuffer.toString('utf-8');
            const xmlData = await parsearXmlAutorizado(xmlContent);
            const ventaXml = this.buildVentaDesdeXml(xmlData, venta.factura);
            base64 = await generateA4Factura(ventaXml);

        } else {
            // ── COMPROBANTE: leer desde BD ─────────────────────────────────
            base64 = await generateA4Comprobante(venta);
        }

        return { base64 };
    }
}
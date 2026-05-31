import {
    ASSETS, createDoc, docToBase64,
    separadorDash, linea2ColTicket, camposAdicionalesTicket,
} from '../shared/pdf-base.helper';
import { generarBarcode } from '../shared/barcode.helper';
import { calculateTicketHeight } from '../shared/ticket-height.helper';
const W = 208;
const MARGEN = 5;
const UTIL = W - MARGEN * 2;

export async function generateTicketFactura(venta: any): Promise<string> {
    // ── 1. Async PRIMERO: Generar código de barras antes de iniciar el PDF ──
    let barcodeBuffer: Buffer | null = null;
    if (venta.factura?.clave_acceso) {
        try {
            barcodeBuffer = await generarBarcode(venta.factura.clave_acceso, 2, 8);
        } catch (_) { }
    }

    // ── 2. Calcular la altura exacta antes de inicializar el documento ──

    const estimatedHeight = calculateTicketHeight(venta.detalles, {
        comprobanteHeaderHeight: 30 + (venta.factura?.clave_acceso ? 8 : 0),
        clienteCamposAdicionales: venta.cliente.camposAdicionales?.length ?? 0,
        clienteExtras: {
            direccion: venta.cliente.direccion,
            telefono: venta.cliente.telefono,
            email: venta.cliente.email,
        },
        totalesFijos: true,
        propina: venta.propina,
        factura: venta.factura ? {
            clave_acceso: venta.factura.clave_acceso,
            fecha_autorizacion: venta.factura.fecha_autorizacion,
            barcodeBuffer,                  // ya calculado antes de llamar aquí
        } : null,
        safetyPad: 10,
    });

    // ── 3. Crear el documento con el tamaño dinámico perfecto ────────────────
    const doc = createDoc({
        size: [W, estimatedHeight],
        margins: { top: 10, bottom: 10, left: MARGEN, right: MARGEN },
        autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    // ── Logo ──────────────────────────────────────────────────────────────
    try { doc.image(ASSETS.logo, MARGEN, doc.y, { width: 55 }); doc.moveDown(0.3); }
    catch (_) { }

    // ── Empresa ───────────────────────────────────────────────────────────
    doc.font('Bold').fontSize(9)
        .text(venta.empresa.empresas_nombreComercial || venta.empresa.empresas_razonSocial,
            { align: 'center' });
    doc.font('Regular').fontSize(7)
        .text(`RUC: ${venta.empresa.empresas_ruc}`, { align: 'center' })
        .text(venta.empresa.empresas_dirMatriz, { align: 'center' });

    separadorDash(doc, MARGEN, UTIL);

    // ── Tipo comprobante + número ─────────────────────────────────────────
    doc.font('Bold').fontSize(8)
        .text('FACTURA', { align: 'center' });
    doc.font('Regular').fontSize(7)
        .text(`N°: ${venta.numero_venta}`, { align: 'center' })
        .text(`Fecha: ${new Date(venta.fecha_emision).toLocaleString('es-EC')}`, { align: 'center' });

    // ── Clave de acceso (compacta) ─────────────────────────────────────────
    if (venta.factura?.clave_acceso) {
        doc.font('Regular').fontSize(5)
            .text(venta.factura.clave_acceso, { align: 'center' });
    }

    separadorDash(doc, MARGEN, UTIL);

    // ── Cliente ───────────────────────────────────────────────────────────
    doc.font('Bold').fontSize(7).text('Cliente:');
    doc.font('Regular').fontSize(7)
        .text(venta.cliente.razon_social)
        .text(`${venta.cliente.tipo_identificacion}: ${venta.cliente.identificacion}`);

    if (venta.cliente.direccion) doc.text(`Dir: ${venta.cliente.direccion}`);
    if (venta.cliente.telefono) doc.text(`Tel: ${venta.cliente.telefono}`);
    if (venta.cliente.email) doc.text(`Email: ${venta.cliente.email}`);

    // Campos adicionales del cliente
    camposAdicionalesTicket(doc, venta.cliente.camposAdicionales, MARGEN);

    separadorDash(doc, MARGEN, UTIL);

    // ── Detalle ───────────────────────────────────────────────────────────
    doc.font('Bold').fontSize(7).text('Detalle:');
    const cCant = 22;
    const cTotal = 42;
    const cDesc = UTIL - cCant - cTotal;
    const x0 = MARGEN;

    // Header
    const yH = doc.y;
    doc.font('Bold').fontSize(7)
        .text('Cant', x0, yH, { width: cCant, lineBreak: false })
        .text('Desc.', x0 + cCant, yH, { width: cDesc, lineBreak: false })
        .text('Total', x0 + cCant + cDesc, yH, { width: cTotal, align: 'right', lineBreak: false });
    doc.y = yH + 10;
    doc.moveTo(x0, doc.y).lineTo(x0 + UTIL, doc.y).stroke();
    doc.moveDown(0.2);

    doc.font('Regular').fontSize(7);
    for (const d of venta.detalles) {
        const nombre = d.lote?.item?.item_nombre ?? d.item?.item_nombre ?? '—';
        const subtotal = (Number(d.precio_unitario) * d.cantidad).toFixed(2);
        const yR = doc.y;

        doc.text(String(d.cantidad), x0, yR, { width: cCant, lineBreak: false });
        doc.text(nombre, x0 + cCant, yR, { width: cDesc, lineBreak: true });
        const yNext = doc.y;
        doc.text(`$${subtotal}`, x0 + cCant + cDesc, yR, { width: cTotal, align: 'right', lineBreak: false });
        doc.y = yNext;
        doc.moveDown(0.15);
    }

    separadorDash(doc, MARGEN, UTIL);

    // ── Totales ───────────────────────────────────────────────────────────
    const xL = MARGEN;
    const xR = MARGEN + UTIL;

    linea2ColTicket(doc, 'Regular', 7, xL, 'Subtotal:', `$${Number(venta.subtotal).toFixed(2)}`, xR, UTIL);
    linea2ColTicket(doc, 'Regular', 7, xL, 'Descuento:', `$${Number(venta.descuento_total).toFixed(2)}`, xR, UTIL);
    linea2ColTicket(doc, 'Regular', 7, xL, 'IVA:', `$${Number(venta.iva).toFixed(2)}`, xR, UTIL);

    if (Number(venta.propina) > 0) {
        linea2ColTicket(doc, 'Regular', 7, xL, 'Propina:', `$${Number(venta.propina).toFixed(2)}`, xR, UTIL);
    }

    linea2ColTicket(doc, 'Bold', 9, xL, 'TOTAL:', `$${Number(venta.total).toFixed(2)}`, xR, UTIL);

    // ── Información SRI ───────────────────────────────────────────────────
    if (venta.factura) {
        const f = venta.factura;
        separadorDash(doc, MARGEN, UTIL);

        doc.font('Bold').fontSize(7).text('Comprobante Electrónico:', { align: 'center' });
        doc.font('Regular').fontSize(6)
            .text(`Ambiente: ${f.ambiente == 2 ? 'PRODUCCIÓN' : 'PRUEBAS'}`, { align: 'center' })
            .text(`Estado: ${f.estadoSri?.codigo ?? '—'}`, { align: 'center' });

        if (f.fecha_autorizacion) {
            doc.fontSize(5)
                .text(`Autorización: ${new Date(f.fecha_autorizacion).toLocaleString('es-EC')}`,
                    { align: 'center' });
        }

        // Usar buffer ya listo, de forma síncrona
        if (barcodeBuffer) {
            doc.moveDown(0.3);
            doc.image(barcodeBuffer, { width: UTIL });  // sin x,y → PDFKit mueve doc.y solo
            doc.moveDown(0.5);
        }

        doc.font('Regular').fontSize(5)
            .text(f.clave_acceso, { align: 'center' });
    }

    // ── Pie ───────────────────────────────────────────────────────────────
    separadorDash(doc, MARGEN, UTIL);
    doc.font('Regular').fontSize(7).text('Gracias por su compra', { align: 'center' });

    // Cierre del documento y retorno como Promise Base64
    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
        doc.on('error', reject);
        doc.end();
    });
}


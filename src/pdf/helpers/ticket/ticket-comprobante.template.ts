import {
    ASSETS, createDoc, docToBase64,
    separadorDash, linea2ColTicket, camposAdicionalesTicket,
} from '../shared/pdf-base.helper';
import * as bwipjs from 'bwip-js'; // Asegúrate de importarlo si vas a usar el código de barras
import { calculateTicketHeight } from '../shared/ticket-height.helper';


const W = 208;
const MARGEN = 5;
const UTIL = W - MARGEN * 2;

export async function generateTicketComprobante(venta: any): Promise<string> {
    // 1. Calculamos el alto dinámico antes de crear el documento
    const estimatedHeight = calculateTicketHeight(venta.detalles, {
        comprobanteHeaderHeight: 38,
        clienteCamposAdicionales: venta.cliente.camposAdicionales?.length ?? 0,
        totalesCondicionales: {
            descuento_total: venta.descuento_total,
            iva: venta.iva,
        },
        propina: venta.propina,
        observaciones: venta.observaciones,
        factura: venta.factura ? {
            clave_acceso: venta.factura.clave_acceso,
            fecha_autorizacion: venta.factura.fecha_autorizacion,
            // sin barcodeBuffer → usa la rama fija de 48pt
        } : null,
    });

    const doc = createDoc({
        size: [W, estimatedHeight],
        margins: { top: 10, bottom: 10, left: MARGEN, right: MARGEN },
        autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));

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

    // ── Comprobante ───────────────────────────────────────────────────────
    doc.font('Bold').fontSize(8)
        .text(venta.tipoComprobante.nombre.toUpperCase(), { align: 'center' });
    doc.font('Regular').fontSize(7)
        .text(`N°: ${venta.numero_venta}`, { align: 'center' })
        .text(`Fecha: ${new Date(venta.fecha_emision).toLocaleString('es-EC')}`, { align: 'center' })
        .text(`Pago: ${venta.formaPago.nombre}`, { align: 'center' });

    separadorDash(doc, MARGEN, UTIL);

    // ── Cliente ───────────────────────────────────────────────────────────
    doc.font('Bold').fontSize(7).text('Cliente:');
    doc.font('Regular').fontSize(7)
        .text(venta.cliente.razon_social)
        .text(`CI/RUC: ${venta.cliente.identificacion}`);

    camposAdicionalesTicket(doc, venta.cliente.camposAdicionales, MARGEN);

    separadorDash(doc, MARGEN, UTIL);

    // ── Detalle ───────────────────────────────────────────────────────────
    const cCant = 22;
    const cTotal = 42;
    const cDesc = UTIL - cCant - cTotal;
    const x0 = MARGEN;

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

    if (Number(venta.descuento_total) > 0) {
        linea2ColTicket(doc, 'Regular', 7, xL, 'Descuento:', `$${Number(venta.descuento_total).toFixed(2)}`, xR, UTIL);
    }
    if (Number(venta.iva) > 0) {
        linea2ColTicket(doc, 'Regular', 7, xL, 'IVA:', `$${Number(venta.iva).toFixed(2)}`, xR, UTIL);
    }
    if (Number(venta.propina) > 0) {
        linea2ColTicket(doc, 'Regular', 7, xL, 'Propina:', `$${Number(venta.propina).toFixed(2)}`, xR, UTIL);
    }

    linea2ColTicket(doc, 'Bold', 9, xL, 'TOTAL:', `$${Number(venta.total).toFixed(2)}`, xR, UTIL);

    if (venta.observaciones) {
        separadorDash(doc, MARGEN, UTIL);
        doc.font('Bold').fontSize(7).text('Obs: ', { continued: true });
        doc.font('Regular').text(venta.observaciones);
    }

    // ── Factura Electrónica (SRI) ─────────────────────────────────────────
    // Reintegra este bloque si este documento es una Factura autorizada por el SRI
    if (venta.factura) {
        const f = venta.factura;
        separadorDash(doc, MARGEN, UTIL);

        doc.font('Bold').fontSize(7).text('Información SRI:', { align: 'center' });
        doc.font('Regular').fontSize(7)
            .text(`Ambiente: ${f.ambiente == 2 ? 'PRODUCCIÓN' : 'PRUEBAS'}`, { align: 'center' })
            .text(`Estado: ${f.estadoSri?.codigo ?? '—'}`, { align: 'center' })
            .fontSize(6).text(`Autorización: ${f.fecha_autorizacion ?? '—'}`, { align: 'center' })
            .fontSize(7).text('Clave de Acceso:', { align: 'center' })
            .fontSize(5).text(f.clave_acceso, { align: 'center' });

        try {
            const barcodePng = await bwipjs.toBuffer({
                bcid: 'code128',
                text: f.clave_acceso,
                scale: 2,
                height: 8,
                includetext: false,
            });
            doc.image(barcodePng, MARGEN, doc.y + 4, { width: UTIL });
            doc.moveDown(2.5);
        } catch (_) { }
    }

    // ── Pie ───────────────────────────────────────────────────────────────
    separadorDash(doc, MARGEN, UTIL);
    doc.font('Regular').fontSize(7)
        .text('Gracias por su compra', { align: 'center' });

    return docToBase64(doc);
}


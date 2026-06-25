// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import type { ReporteIvaCompletoDto } from '../../dto/response/reporte-iva-completo.dto';

export async function generarIvaPdf(data: ReporteIvaCompletoDto): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    doc.font('Helvetica-Bold').fontSize(16).text(`Declaración IVA — ${data.mes}/${data.anio}`);
    doc.moveDown(1);

    doc.fontSize(12).text('Resumen Ventas', { underline: true });
    data.resumen_ventas.forEach((r) =>
        doc.fontSize(10).text(
            `Tarifa ${r.tarifa_porcentaje}% — Base: $${r.base_imponible.toFixed(2)} — IVA: $${r.iva.toFixed(2)} — Registros: ${r.cantidad_registros}`,
        ),
    );

    doc.moveDown(0.5).fontSize(12).text('Resumen Compras', { underline: true });
    data.resumen_compras.forEach((r) =>
        doc.fontSize(10).text(
            `Tarifa ${r.tarifa_porcentaje}% — Base: $${r.base_imponible.toFixed(2)} — IVA: $${r.iva.toFixed(2)} — Registros: ${r.cantidad_registros}`,
        ),
    );

    doc.moveDown(1).fontSize(12).font('Helvetica-Bold')
        .text(`IVA en ventas:  $${data.iva_total_ventas.toFixed(2)}`)
        .text(`IVA en compras: $${data.iva_total_compras.toFixed(2)}`)
        .text(`IVA A PAGAR:    $${data.iva_a_pagar.toFixed(2)}`);

    doc.moveDown(1).font('Helvetica-Bold').fontSize(12).text('Detalle de Ventas');
    doc.font('Helvetica').fontSize(8);
    data.detalle_ventas.forEach((v) =>
        doc.text(
            `${v.numero_venta} | ${v.cliente} | ${v.item_nombre} | Base: $${v.base_imponible.toFixed(2)} | IVA: $${v.iva_calculado.toFixed(2)}`,
        ),
    );

    doc.moveDown(1).font('Helvetica-Bold').fontSize(12).text('Detalle de Compras');
    doc.font('Helvetica').fontSize(8);
    data.detalle_compras.forEach((c) =>
        doc.text(
            `${c.numero_documento} | ${c.proveedor} | Base: $${c.base_imponible.toFixed(2)} | IVA: $${c.iva.toFixed(2)}`,
        ),
    );

    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
    });
}
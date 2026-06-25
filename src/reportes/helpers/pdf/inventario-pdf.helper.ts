// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import type { ReporteInventarioResponseDto } from '../../dto/response/reporte-inventario-response.dto';

export async function generarInventarioPdf(
    data: ReporteInventarioResponseDto,
): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    doc.font('Helvetica-Bold').fontSize(16)
        .text(`Inventario Valorado — corte ${data.fecha_corte.toISOString().split('T')[0]}`);
    doc.moveDown(1).font('Helvetica').fontSize(9);

    data.items.forEach((i) => {
        doc.font('Helvetica-Bold').text(`${i.codigo} — ${i.nombre}`);
        doc.font('Helvetica').text(
            `  Stock: ${i.stock_total} | CPP: $${i.costo_promedio.toFixed(4)} | Valor: $${i.valor_total.toFixed(2)}`,
        );
    });

    doc.moveDown(1).font('Helvetica-Bold').fontSize(12)
        .text(`VALOR TOTAL INVENTARIO: $${data.valor_total_inventario.toFixed(2)}`);

    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
    });
}
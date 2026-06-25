// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import type { ReporteCuentasPagarResponseDto } from '../../dto/response/reporte-cuentas-pagar-response.dto';

export async function generarCuentasPagarPdf(
    data: ReporteCuentasPagarResponseDto,
): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    doc.font('Helvetica-Bold').fontSize(16)
        .text(`Cuentas por Pagar — corte ${data.fecha_corte.toISOString().split('T')[0]}`);
    doc.moveDown(1).fontSize(9);

    data.proveedores.forEach((p) => {
        doc.font('Helvetica-Bold').text(`${p.razon_social} (${p.identificacion}) — Saldo: $${p.saldo_total.toFixed(2)}`);
        doc.font('Helvetica');
        p.compras.forEach((c) =>
            doc.text(
                `  ${c.numero_documento} | ${c.estado_pago} | Saldo: $${c.saldo_pendiente.toFixed(2)} | ${c.dias_antiguedad} días`,
            ),
        );
        doc.moveDown(0.3);
    });

    doc.moveDown(1).font('Helvetica-Bold').fontSize(12)
        .text(`TOTAL POR PAGAR: $${data.total_por_pagar.toFixed(2)}`);

    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
    });
}
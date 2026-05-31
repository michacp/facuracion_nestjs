// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import * as path from 'path';

export const ASSETS = {
    logo: path.join(process.cwd(), 'src/pdf/assets/logo.png'),
    fontRegular: path.join(process.cwd(), 'src/pdf/fonts/Roboto-Regular.ttf'),
    fontBold: path.join(process.cwd(), 'src/pdf/fonts/Roboto-Bold.ttf'),
};

export function createDoc(options: any): any {
    const doc = new PDFDocument(options);
    doc.registerFont('Regular', ASSETS.fontRegular);
    doc.registerFont('Bold', ASSETS.fontBold);
    return doc;
}

export function docToBase64(doc: any): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
        doc.on('error', reject);
        doc.end();
    });
}

export function separadorDash(doc: any, x: number, width: number) {
    doc.moveDown(0.3);
    doc.moveTo(x, doc.y).lineTo(x + width, doc.y).dash(2, { space: 2 }).stroke();
    doc.undash().moveDown(0.3);
}

export function cajaTituloA4(doc: any, texto: string, x: number, width: number) {
    const y = doc.y;
    doc.rect(x, y, width, 16).fill('#2C3E50').stroke();
    doc.fill('#FFFFFF').font('Bold').fontSize(9)
        .text(texto, x + 5, y + 3, { width: width - 10 });
    doc.fill('#000000');
    doc.y = y + 22;
}

export function linea2ColTicket(
    doc: any,
    font: 'Regular' | 'Bold',
    size: number,
    xLeft: number,
    label: string,
    value: string,
    xRight: number,
    _width: number,
) {
    const y = doc.y;
    doc.font(font).fontSize(size);
    doc.text(label, xLeft, y, { lineBreak: false });
    doc.text(value, xLeft, y, { width: xRight - xLeft, align: 'right', lineBreak: false });
    doc.y = y + size + 3;
}

export function camposAdicionalesTicket(
    doc: any,
    campos: { clave: string; valor: string }[] | null,
    x: number,
) {
    for (const c of campos ?? []) {
        if (c.valor?.trim()) {
            doc.font('Bold').fontSize(7).text(`${c.clave}: `, x, doc.y, { continued: true });
            doc.font('Regular').text(c.valor);
        }
    }
}

export function camposAdicionalesA4(
    doc: any,
    campos: { clave: string; valor: string }[] | null,
    x: number,
    width: number,
) {
    for (const c of campos ?? []) {
        if (c.valor?.trim()) {
            doc.font('Bold').fontSize(9).text(`${c.clave}: `, x, doc.y, { continued: true, width });
            doc.font('Regular').text(c.valor, { width });
        }
    }
}

export function totalesA4(doc: any, venta: any, xTot: number) {
    const rows = [
        ['Subtotal:', `$${Number(venta.subtotal).toFixed(2)}`],
        ['Descuento:', `$${Number(venta.descuento_total).toFixed(2)}`],
        ['IVA:', `$${Number(venta.iva).toFixed(2)}`],
        ['Propina:', `$${Number(venta.propina).toFixed(2)}`],
    ];

    for (const [label, value] of rows) {
        const y = doc.y;
        doc.font('Regular').fontSize(9)
            .text(label, xTot, y, { width: 90, lineBreak: false })
            .text(value, xTot + 90, y, { width: 80, align: 'right', lineBreak: false });
        doc.y = y + 14;
    }

    const y = doc.y;
    doc.font('Bold').fontSize(11)
        .text('TOTAL:', xTot, y, { width: 90, lineBreak: false })
        .text(`$${Number(venta.total).toFixed(2)}`, xTot + 90, y, { width: 80, align: 'right', lineBreak: false });
    doc.y = y + 18;
}
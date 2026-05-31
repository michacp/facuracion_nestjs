// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import * as path from 'path';
import {
    ASSETS, createDoc, docToBase64,
    cajaTituloA4, camposAdicionalesA4, totalesA4,
} from '../shared/pdf-base.helper';
import { generarBarcode } from '../shared/barcode.helper';

const ML = 40;
const MR = 40;
const PW = 595;
const W = PW - ML - MR;

export async function generateA4Factura(venta: any): Promise<string> {
    // ── Generar todos los recursos async ANTES de crear el doc ────────────
    let barcodeBuffer: Buffer | null = null;
    if (venta.factura?.clave_acceso) {
        try {
            // El ancho estándar SRI requiere un código de barras limpio
            barcodeBuffer = await generarBarcode(venta.factura.clave_acceso, 2, 10);
        } catch (_) { }
    }

    // ── Estructura base del documento ─────────────────────────────────────
    const doc = createDoc({ size: 'A4', margins: { top: 40, bottom: 40, left: ML, right: MR } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    const f = venta.factura;
    const yTop = doc.y;

    // ── Configuración de Layout Dinámico (SRI Style) ──────────────────────
    // Comprobamos si existe un logo válido para calcular espacios
    const hasLogo = !!ASSETS.logo;
    const logoW = hasLogo ? 110 : 0;
    const logoH = hasLogo ? 55 : 0;

    const boxW = 230; // Ancho estándar para el recuadro del SRI (permite leer bien la clave)
    const leftW = W - boxW - 15; // Espacio restante para datos de la empresa
    const xBox = ML + leftW + 15;
    const yBox = yTop;

    // ── Columna Izquierda: Empresa & Logos ────────────────────────────────
    let yLeft = yTop;

    if (hasLogo) {
        try {
            doc.image(ASSETS.logo, ML, yLeft, { width: logoW });
            yLeft += logoH + 12;
        } catch (_) { }
    }

    // Datos de la Empresa (Alineación a la izquierda conforme a la norma)
    doc.font('Bold').fontSize(11)
        .text(venta.empresa.empresas_razonSocial, ML, yLeft, { width: leftW });

    doc.font('Regular').fontSize(8).moveDown(0.3);
    doc.text(`Nombre Comercial: ${venta.empresa.empresas_nombreComercial ?? '—'}`, { width: leftW })
        .text(`Dirección Matriz: ${venta.empresa.empresas_dirMatriz}`, { width: leftW })
        .text(`Dirección Sucursal: ${venta.sucursal?.sucursales_direccion ?? venta.empresa.empresas_dirMatriz}`, { width: leftW });

    doc.moveDown(0.4);
    if (venta.empresa.empresas_contribuyenteEspecial) {
        doc.text(`Contribuyente Especial Nro: ${venta.empresa.empresas_contribuyenteEspecial}`, { width: leftW });
    }

    const obligado = venta.empresa.empresas_obligadoContabilidad || 'NO';
    doc.text(`OBLIGADO A LLEVAR CONTABILIDAD: ${obligado.toUpperCase()}`, { width: leftW });

    if (venta.empresa.empresas_regimen) {
        doc.text(`Régimen: ${venta.empresa.empresas_regimen}`, { width: leftW });
    }

    const leftMaxY = doc.y;

    // ── Columna Derecha: Recuadro Oficial SRI / RIDE ──────────────────────
    let yCurRight = yBox + 8;

    doc.font('Bold').fontSize(10.5)
        .text(`R.U.C.: ${venta.empresa.empresas_ruc}`, xBox + 8, yCurRight, { width: boxW - 16 });
    yCurRight = doc.y + 4;

    doc.font('Bold').fontSize(13)
        .text('FACTURA', xBox + 8, yCurRight, { width: boxW - 16 });
    yCurRight = doc.y + 2;

    doc.font('Regular').fontSize(10)
        .text(`No. ${venta.numero_venta}`, xBox + 8, yCurRight, { width: boxW - 16 });
    yCurRight = doc.y + 6;

    doc.font('Bold').fontSize(7.5)
        .text('NÚMERO DE AUTORIZACIÓN:', xBox + 8, yCurRight, { width: boxW - 16 });
    yCurRight = doc.y + 2;

    doc.font('Regular').fontSize(7.5)
        .text(f?.clave_acceso ?? '—', xBox + 8, yCurRight, { width: boxW - 16 });
    yCurRight = doc.y + 6;

    doc.font('Bold').fontSize(7.5)
        .text('FECHA Y HORA DE AUTORIZACIÓN:', xBox + 8, yCurRight, { width: boxW - 16 });
    yCurRight = doc.y + 2;

    const fechaAuth = f?.fecha_autorizacion
        ? new Date(f.fecha_autorizacion).toLocaleString('es-EC')
        : 'PENDIENTE';
    doc.font('Regular').fontSize(7.5)
        .text(fechaAuth, xBox + 8, yCurRight, { width: boxW - 16 });
    yCurRight = doc.y + 6;

    doc.font('Regular').fontSize(7.5)
        .text(`AMBIENTE: ${f?.ambiente == 2 ? 'PRODUCCIÓN' : 'PRUEBAS'}`, xBox + 8, yCurRight, { width: boxW - 16 });
    yCurRight = doc.y + 2;

    doc.text(`EMISIÓN: NORMAL`, xBox + 8, doc.y, { width: boxW - 16 });
    yCurRight = doc.y + 8;

    doc.font('Bold').fontSize(7.5)
        .text('CLAVE DE ACCESO:', xBox + 8, yCurRight, { width: boxW - 16 });
    yCurRight = doc.y + 4;

    // Código de barras integrado en el bloque derecho
    if (barcodeBuffer) {
        try {
            doc.image(barcodeBuffer, xBox + 10, yCurRight, { width: boxW - 20, height: 32 });
            yCurRight += 36;
        } catch (_) { }
    }

    doc.font('Regular').fontSize(6.5)
        .text(f?.clave_acceso ?? '—', xBox + 5, yCurRight, { width: boxW - 10, align: 'center' });
    yCurRight = doc.y + 8;

    // Dibujar el contenedor del bloque SRI
    doc.rect(xBox, yBox, boxW, yCurRight - yBox).stroke();

    // El cursor baja dinámicamente según el bloque que haya quedado más alto
    doc.y = Math.max(leftMaxY, yCurRight) + 15;

    // ── Datos del Comprador ───────────────────────────────────────────────
    cajaTituloA4(doc, 'DATOS DEL COMPRADOR', ML, W);

    const col = W / 2;
    const yC = doc.y;

    [
        ['Razón Social:', venta.cliente.razon_social],
        ['Identificación:', venta.cliente.identificacion],
        ['Dirección:', venta.cliente.direccion ?? '—'],
    ].forEach(([label, value]) => {
        doc.font('Bold').fontSize(8.5).text(label, ML, doc.y, { continued: true, width: col });
        doc.font('Regular').text(` ${value}`, { width: col });
    });

    let yD = yC;
    [
        ['Teléfono:', venta.cliente.telefono ?? '—'],
        ['Email:', venta.cliente.email ?? '—'],
        ['Fecha Emisión:', new Date(venta.fecha_emision).toLocaleDateString('es-EC')],
        ['Forma de Pago:', venta.formaPago.nombre],
    ].forEach(([label, value]) => {
        doc.font('Bold').fontSize(8.5).text(label, ML + col, yD, { continued: true, width: col });
        doc.font('Regular').text(` ${value}`, { width: col });
        yD += 13;
    });

    doc.y = Math.max(doc.y, yD) + 4;
    camposAdicionalesA4(doc, venta.cliente.camposAdicionales, ML, W);
    doc.moveDown(0.5);

    // ── Tabla de Detalles ─────────────────────────────────────────────────
    cajaTituloA4(doc, 'DETALLE', ML, W);

    const cods = {
        cod: 70,
        desc: W - 70 - 35 - 60 - 50 - 55 - 55,
        cant: 35,
        pu: 60,
        desc2: 50,
        dto: 55,
        total: 55,
    };
    const xC = {
        cod: ML,
        desc: ML + cods.cod,
        cant: ML + cods.cod + cods.desc,
        pu: ML + cods.cod + cods.desc + cods.cant,
        desc2: ML + cods.cod + cods.desc + cods.cant + cods.pu,
        dto: ML + cods.cod + cods.desc + cods.cant + cods.pu + cods.desc2,
        total: ML + cods.cod + cods.desc + cods.cant + cods.pu + cods.desc2 + cods.dto,
    };

    const yHd = doc.y;
    doc.rect(ML, yHd, W, 16).fill('#EEEEEE').stroke();
    doc.fill('#000').font('Bold').fontSize(8);

    ([
        [xC.cod, cods.cod, 'Código', 'left'],
        [xC.desc, cods.desc, 'Descripción', 'left'],
        [xC.cant, cods.cant, 'Cant.', 'center'],
        [xC.pu, cods.pu, 'P.Unit.', 'right'],
        [xC.desc2, cods.desc2, 'Desc%', 'right'],
        [xC.dto, cods.dto, 'Descuento', 'right'],
        [xC.total, cods.total, 'Total', 'right'],
    ] as [number, number, string, any][]).forEach(([x, w, t, a]) => {
        doc.text(t, x, yHd + 3, { width: w, align: a, lineBreak: false });
    });
    doc.y = yHd + 20;

    doc.font('Regular').fontSize(8);
    for (const d of venta.detalles) {
        const item = d.lote?.item ?? d.item;
        const subtotal = ((Number(d.precio_unitario) * d.cantidad) - Number(d.descuento)).toFixed(2);
        const yRow = doc.y;

        doc.text(item?.item_codigo_principal ?? '—', xC.cod, yRow, { width: cods.cod, lineBreak: false });
        doc.text(item?.item_nombre ?? '—', xC.desc, yRow, { width: cods.desc, lineBreak: true });
        const yNext = doc.y;
        doc.text(String(d.cantidad), xC.cant, yRow, { width: cods.cant, align: 'center', lineBreak: false });
        doc.text(`$${Number(d.precio_unitario).toFixed(2)}`, xC.pu, yRow, { width: cods.pu, align: 'right', lineBreak: false });
        doc.text('0%', xC.desc2, yRow, { width: cods.desc2, align: 'right', lineBreak: false });
        doc.text(`$${Number(d.descuento).toFixed(2)}`, xC.dto, yRow, { width: cods.dto, align: 'right', lineBreak: false });
        doc.text(`$${subtotal}`, xC.total, yRow, { width: cods.total, align: 'right', lineBreak: false });
        doc.y = yNext;
        doc.moveDown(0.3);
    }

    doc.moveTo(ML, doc.y).lineTo(ML + W, doc.y).stroke();
    doc.moveDown(0.5);

    // ── Totales + Observaciones ───────────────────────────────────────────
    const xTot = ML + W - 180;
    const yTO = doc.y;

    doc.font('Bold').fontSize(8.5).text('Observaciones:', ML, yTO);
    doc.font('Regular').fontSize(8.5)
        .text(venta.observaciones || '—', ML, doc.y, { width: W / 2 - 10 });

    doc.y = yTO;
    totalesA4(doc, venta, xTot);

    // Pie de página reglamentario RIDE
    doc.moveDown(2);
    doc.font('Regular').fontSize(8)
        .text('Documento generado electrónicamente — RIDE', { align: 'center' });

    // ── Retorno de Promesa en Base64 ──────────────────────────────────────
    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
        doc.on('error', reject);
        doc.end();
    });
}
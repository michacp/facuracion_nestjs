import {
    ASSETS, createDoc, docToBase64,
    cajaTituloA4, camposAdicionalesA4, totalesA4,
} from '../shared/pdf-base.helper';

const ML = 40;
const MR = 40;
const PW = 595;
const W = PW - ML - MR;

export async function generateA4Comprobante(venta: any): Promise<string> {
    const doc = createDoc({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: ML, right: MR },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));

    const yTop = doc.y;

    // ── Cabecera simple ───────────────────────────────────────────────────
    const logoW = 80;
    const boxW = 160;
    const empresaW = W - logoW - boxW - 20;

    try { doc.image(ASSETS.logo, ML, yTop, { width: logoW }); }
    catch (_) { }

    doc.font('Bold').fontSize(11)
        .text(venta.empresa.empresas_razonSocial, ML + logoW + 10, yTop,
            { width: empresaW, align: 'center' });
    doc.font('Regular').fontSize(8)
        .text(`RUC: ${venta.empresa.empresas_ruc}`, ML + logoW + 10, doc.y, { width: empresaW, align: 'center' })
        .text(venta.empresa.empresas_dirMatriz, ML + logoW + 10, doc.y, { width: empresaW, align: 'center' })
        .text(venta.empresa.empresas_telefono ?? '', ML + logoW + 10, doc.y, { width: empresaW, align: 'center' });

    // Box tipo comprobante
    const xBox = ML + logoW + 10 + empresaW + 10;
    doc.rect(xBox, yTop, boxW, 80).stroke();
    doc.rect(xBox, yTop, boxW, 18).fill('#EEEEEE').stroke();
    doc.fill('#000').font('Bold').fontSize(9)
        .text(`RUC: ${venta.empresa.empresas_ruc}`, xBox + 5, yTop + 4,
            { width: boxW - 10, align: 'center' });
    doc.rect(xBox, yTop + 18, boxW, 18).fill('#EEEEEE').stroke();
    doc.fill('#000').font('Bold').fontSize(9)
        .text(venta.tipoComprobante.nombre.toUpperCase(), xBox + 5, yTop + 22,
            { width: boxW - 10, align: 'center' });
    doc.font('Bold').fontSize(9)
        .text(`Nro. ${venta.numero_venta}`, xBox + 5, yTop + 42,
            { width: boxW - 10, align: 'center' });
    doc.font('Regular').fontSize(8)
        .text(`Fecha: ${new Date(venta.fecha_emision).toLocaleDateString('es-EC')}`, xBox + 5, yTop + 58,
            { width: boxW - 10, align: 'center' });

    doc.y = yTop + 90;
    doc.moveDown(0.5);

    // ── Cliente ───────────────────────────────────────────────────────────
    cajaTituloA4(doc, 'DATOS DEL CLIENTE', ML, W);

    const col = W / 2;
    const yC = doc.y;

    [
        ['Razón Social:', venta.cliente.razon_social],
        ['Identificación:', venta.cliente.identificacion],
        ['Dirección:', venta.cliente.direccion ?? '—'],
    ].forEach(([l, v]) => {
        doc.font('Bold').fontSize(9).text(l, ML, doc.y, { continued: true, width: col });
        doc.font('Regular').text(` ${v}`, { width: col });
    });

    let yD = yC;
    [
        ['Teléfono:', venta.cliente.telefono ?? '—'],
        ['Email:', venta.cliente.email ?? '—'],
        ['Forma de Pago:', venta.formaPago.nombre],
        ['Plazo:', venta.plazo_pago ?? '—'],
    ].forEach(([l, v]) => {
        doc.font('Bold').fontSize(9).text(l, ML + col, yD, { continued: true, width: col });
        doc.font('Regular').text(` ${v}`, { width: col });
        yD += 14;
    });

    doc.y = Math.max(doc.y, yD) + 4;
    camposAdicionalesA4(doc, venta.cliente.camposAdicionales, ML, W);
    doc.moveDown(0.5);

    // ── Detalle ───────────────────────────────────────────────────────────
    cajaTituloA4(doc, 'DETALLE DE PRODUCTOS / SERVICIOS', ML, W);

    const cods = { cod: 70, desc: W - 70 - 35 - 55 - 55 - 55, cant: 35, pu: 55, dto: 55, total: 55 };
    const xC = {
        cod: ML,
        desc: ML + cods.cod,
        cant: ML + cods.cod + cods.desc,
        pu: ML + cods.cod + cods.desc + cods.cant,
        dto: ML + cods.cod + cods.desc + cods.cant + cods.pu,
        total: ML + cods.cod + cods.desc + cods.cant + cods.pu + cods.dto,
    };

    const yHd = doc.y;
    doc.rect(ML, yHd, W, 16).fill('#EEEEEE').stroke();
    doc.fill('#000').font('Bold').fontSize(8);
    [
        [xC.cod, cods.cod, 'Código', 'left'],
        [xC.desc, cods.desc, 'Descripción', 'left'],
        [xC.cant, cods.cant, 'Cant.', 'center'],
        [xC.pu, cods.pu, 'P.Unit.', 'right'],
        [xC.dto, cods.dto, 'Descuento', 'right'],
        [xC.total, cods.total, 'Total', 'right'],
    ].forEach(([x, w, t, a]) => {
        doc.text(t as string, x as number, yHd + 3,
            { width: w as number, align: a as any, lineBreak: false });
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
        doc.text(`$${Number(d.descuento).toFixed(2)}`, xC.dto, yRow, { width: cods.dto, align: 'right', lineBreak: false });
        doc.text(`$${subtotal}`, xC.total, yRow, { width: cods.total, align: 'right', lineBreak: false });
        doc.y = yNext;
        doc.moveDown(0.3);
    }

    doc.moveTo(ML, doc.y).lineTo(ML + W, doc.y).stroke();
    doc.moveDown(0.5);

    // ── Totales ───────────────────────────────────────────────────────────
    const xTot = ML + W - 180;
    const yTO = doc.y;

    doc.font('Bold').fontSize(9).text('Observaciones:', ML, yTO);
    doc.font('Regular').fontSize(9).text(venta.observaciones ?? '—', ML, doc.y, { width: W / 2 - 10 });

    doc.y = yTO;
    totalesA4(doc, venta, xTot);

    // ── Pie ───────────────────────────────────────────────────────────────
    doc.moveDown(1);
    doc.font('Regular').fontSize(8)
        .text('Documento generado por el sistema', { align: 'center' });

    return docToBase64(doc);
}
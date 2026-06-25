import * as ExcelJS from 'exceljs';
import type { ReporteIvaCompletoDto } from '../../dto/response/reporte-iva-completo.dto';


export async function generarIvaExcel(data: ReporteIvaCompletoDto): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();

    // ── Hoja Resumen ──────────────────────────────────────────────────────
    const resumen = wb.addWorksheet('Resumen');
    resumen.addRow([`DECLARACIÓN IVA — ${data.mes}/${data.anio}`]).font = { bold: true, size: 14 };
    resumen.addRow([]);
    resumen.addRow(['VENTAS POR TARIFA']).font = { bold: true };
    resumen.addRow(['Tarifa %', 'Base Imponible', 'IVA', 'Registros']).font = { bold: true };
    data.resumen_ventas.forEach((r) =>
        resumen.addRow([r.tarifa_porcentaje, r.base_imponible, r.iva, r.cantidad_registros]),
    );
    resumen.addRow([]);
    resumen.addRow(['COMPRAS POR TARIFA']).font = { bold: true };
    resumen.addRow(['Tarifa %', 'Base Imponible', 'IVA', 'Registros']).font = { bold: true };
    data.resumen_compras.forEach((r) =>
        resumen.addRow([r.tarifa_porcentaje, r.base_imponible, r.iva, r.cantidad_registros]),
    );
    resumen.addRow([]);
    resumen.addRow(['IVA en ventas', data.iva_total_ventas]);
    resumen.addRow(['IVA en compras', data.iva_total_compras]);
    resumen.addRow(['IVA A PAGAR', data.iva_a_pagar]).font = { bold: true };
    resumen.columns.forEach((c) => (c.width = 18));

    // ── Hoja Detalle Ventas ───────────────────────────────────────────────
    const ventas = wb.addWorksheet('Detalle Ventas');
    ventas.addRow([
        'N° Venta', 'Fecha', 'Cliente', 'Identificación',
        'Ítem', 'Cant.', 'P. Unit.', 'Descuento', 'Base', 'Tarifa %', 'IVA',
    ]).font = { bold: true };
    data.detalle_ventas.forEach((v) =>
        ventas.addRow([
            v.numero_venta, v.fecha_emision, v.cliente, v.identificacion,
            v.item_nombre, v.cantidad, v.precio_unitario, v.descuento,
            v.base_imponible, v.tarifa_porcentaje, v.iva_calculado,
        ]),
    );
    ventas.columns.forEach((c) => (c.width = 16));

    // ── Hoja Detalle Compras ──────────────────────────────────────────────
    const compras = wb.addWorksheet('Detalle Compras');
    compras.addRow([
        'N° Documento', 'Fecha', 'Proveedor', 'Identificación',
        'Base', 'Tarifa %', 'IVA',
    ]).font = { bold: true };
    data.detalle_compras.forEach((c) =>
        compras.addRow([
            c.numero_documento, c.fecha_emision, c.proveedor, c.proveedor_identificacion,
            c.base_imponible, c.tarifa_porcentaje, c.iva,
        ]),
    );
    compras.columns.forEach((c) => (c.width = 18));

    return Buffer.from(await wb.xlsx.writeBuffer());
}
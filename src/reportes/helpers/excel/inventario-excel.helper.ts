import * as ExcelJS from 'exceljs';
import type { ReporteInventarioResponseDto } from '../../dto/response/reporte-inventario-response.dto';

export async function generarInventarioExcel(
    data: ReporteInventarioResponseDto,
): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Inventario Valorado');

    ws.addRow([`INVENTARIO VALORADO — corte ${data.fecha_corte.toISOString().split('T')[0]}`])
        .font = { bold: true, size: 14 };
    ws.addRow([]);
    ws.addRow([
        'Código', 'Producto', 'Stock', 'Costo Promedio (CPP)', 'Valor Total',
    ]).font = { bold: true };

    data.items.forEach((i) =>
        ws.addRow([i.codigo, i.nombre, i.stock_total, i.costo_promedio, i.valor_total]),
    );

    ws.addRow([]);
    ws.addRow(['', '', '', 'TOTAL INVENTARIO', data.valor_total_inventario]).font = { bold: true };
    ws.columns.forEach((c) => (c.width = 20));

    // ── Hoja detalle por lote ────────────────────────────────────────────
    const lotes = wb.addWorksheet('Detalle Lotes');
    lotes.addRow(['Código', 'Producto', 'Lote', 'Cantidad', 'Costo Origen', 'Valor Lote'])
        .font = { bold: true };

    data.items.forEach((i) =>
        i.lotes.forEach((l) =>
            lotes.addRow([i.codigo, i.nombre, l.numero_lote, l.cantidad, l.costo_origen, l.valor_lote]),
        ),
    );
    lotes.columns.forEach((c) => (c.width = 18));

    return Buffer.from(await wb.xlsx.writeBuffer());
}
import * as ExcelJS from 'exceljs';
import type { ReporteCuentasPagarResponseDto } from '../../dto/response/reporte-cuentas-pagar-response.dto';

export async function generarCuentasPagarExcel(
    data: ReporteCuentasPagarResponseDto,
): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Cuentas por Pagar');

    ws.addRow([`CUENTAS POR PAGAR — corte ${data.fecha_corte.toISOString().split('T')[0]}`])
        .font = { bold: true, size: 14 };
    ws.addRow([]);
    ws.addRow([
        'Proveedor', 'Identificación', 'N° Documento', 'Fecha',
        'Total', 'Pagado', 'Saldo', 'Estado', 'Días',
    ]).font = { bold: true };

    data.proveedores.forEach((p) =>
        p.compras.forEach((c) =>
            ws.addRow([
                p.razon_social, p.identificacion, c.numero_documento, c.fecha_emision,
                c.total_pagar, c.total_pagado, c.saldo_pendiente, c.estado_pago, c.dias_antiguedad,
            ]),
        ),
    );

    ws.addRow([]);
    ws.addRow(['', '', '', '', '', '', 'TOTAL POR PAGAR', data.total_por_pagar]).font = { bold: true };
    ws.columns.forEach((c) => (c.width = 18));

    return Buffer.from(await wb.xlsx.writeBuffer());
}
import { ApiProperty } from '@nestjs/swagger';

export class CompraPendienteDto {
    @ApiProperty({ example: 3 })
    compra_id!: number;

    @ApiProperty({ example: '001-001-000000123' })
    numero_documento!: string;

    @ApiProperty({ example: '2026-05-20T00:00:00.000Z' })
    fecha_emision!: Date;

    @ApiProperty({ example: 120.00 })
    total_pagar!: number;

    @ApiProperty({ example: 50.00 })
    total_pagado!: number;

    @ApiProperty({ example: 70.00 })
    saldo_pendiente!: number;

    @ApiProperty({ example: 'PARCIAL' })
    estado_pago!: string;

    @ApiProperty({ example: 34, description: 'Días desde la emisión' })
    dias_antiguedad!: number;
}

export class ProveedorPendienteDto {
    @ApiProperty({ example: 5 })
    proveedor_id!: number;

    @ApiProperty({ example: 'REPUESTOS DEL AUSTRO' })
    razon_social!: string;

    @ApiProperty({ example: '0912345678001' })
    identificacion!: string;

    @ApiProperty({ example: 190.00 })
    saldo_total!: number;

    @ApiProperty({ type: [CompraPendienteDto] })
    compras!: CompraPendienteDto[];
}

export class ReporteCuentasPagarResponseDto {
    @ApiProperty({ example: '2026-06-23T00:00:00.000Z' })
    fecha_corte!: Date;

    @ApiProperty({ example: 620.00 })
    total_por_pagar!: number;

    @ApiProperty({ example: 4 })
    total_proveedores!: number;

    @ApiProperty({ type: [ProveedorPendienteDto] })
    proveedores!: ProveedorPendienteDto[];
}
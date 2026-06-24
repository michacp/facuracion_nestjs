import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoteDetalleDto {
    @ApiProperty({ example: 7 })
    lote_id!: number;

    @ApiProperty({ example: 'C000003-42' })
    numero_lote!: string;

    @ApiProperty({ example: 10 })
    cantidad!: number;

    @ApiProperty({ example: 8.50 })
    costo_origen!: number;

    @ApiProperty({ example: 85.00 })
    valor_lote!: number;
}

export class InventarioItemDto {
    @ApiProperty({ example: 42 })
    item_id!: number;

    @ApiProperty({ example: 'PRO000001' })
    codigo!: string;

    @ApiProperty({ example: 'Cable HDMI 2m' })
    nombre!: string;

    @ApiProperty({ example: 25 })
    stock_total!: number;

    @ApiProperty({ example: 8.20, description: 'Costo Promedio Ponderado' })
    costo_promedio!: number;

    @ApiProperty({ example: 205.00 })
    valor_total!: number;

    @ApiProperty({ type: [LoteDetalleDto] })
    lotes!: LoteDetalleDto[];
}

export class ReporteInventarioResponseDto {
    @ApiProperty({ example: '2026-06-23T00:00:00.000Z' })
    fecha_corte!: Date;

    @ApiProperty({ example: 45 })
    total_items!: number;

    @ApiProperty({ example: 12500.00 })
    valor_total_inventario!: number;

    @ApiProperty({ type: [InventarioItemDto] })
    items!: InventarioItemDto[];
}
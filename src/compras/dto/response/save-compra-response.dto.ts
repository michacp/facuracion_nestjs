import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DetalleCompraResponseDto {
    @ApiProperty({ example: 1 })
    detalle_id!: number;

    @ApiProperty({ example: 42 })
    item_id!: number;

    @ApiProperty({ example: 7, description: 'ID del lote creado' })
    lote_id!: number;

    @ApiProperty({ example: 10 })
    cantidad!: number;

    @ApiPropertyOptional({ example: true, description: 'PVP fue actualizado' })
    pvp_actualizado?: boolean;
}

export class SaveCompraResponseDto {
    @ApiProperty({ example: 3 })
    compra_id!: number;

    @ApiProperty({ example: '001-001-000000123' })
    numero_documento!: string;

    @ApiProperty({ example: 120.00 })
    total_pagar!: number;

    @ApiProperty({ type: [DetalleCompraResponseDto] })
    detalles!: DetalleCompraResponseDto[];
}
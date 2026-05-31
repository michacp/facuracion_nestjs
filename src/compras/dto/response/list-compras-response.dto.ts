import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompraListItemDto {
    @ApiProperty({ example: 3 })
    compra_id!: number;

    @ApiProperty({ example: '001-001-000000123' })
    numero_documento!: string;

    @ApiProperty({ example: 'FACTURA' })
    tipo_documento!: string;

    @ApiProperty({ example: 'REPUESTOS DEL AUSTRO' })
    proveedor!: string;

    @ApiProperty({ example: '0912345678001' })
    proveedor_identificacion!: string;

    @ApiProperty({ example: '2024-06-01T00:00:00.000Z' })
    fecha_emision!: Date;

    @ApiProperty({ example: 100.00 })
    subtotal!: number;

    @ApiProperty({ example: 15.00 })
    valor_impuesto!: number;

    @ApiProperty({ example: 115.00 })
    total_pagar!: number;

    @ApiProperty({ example: 0 })
    total_pagado!: number;

    @ApiProperty({ example: 'PENDIENTE' })
    estado_pago!: string;

    @ApiProperty({ example: 3, description: 'Cantidad de ítems distintos' })
    total_items!: number;

    @ApiProperty({ example: 30, description: 'Unidades totales ingresadas' })
    total_unidades!: number;
}

export class EstadoPagoItemDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'PENDIENTE' })
    name!: string;
}

export class ListComprasResponseDto {
    @ApiProperty({ example: 100 })
    total!: number;

    @ApiProperty({ type: [CompraListItemDto] })
    compras!: CompraListItemDto[];

    @ApiProperty({ type: [EstadoPagoItemDto] })
    estadosPago!: EstadoPagoItemDto[];
}
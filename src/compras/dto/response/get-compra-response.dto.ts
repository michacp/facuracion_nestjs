import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DetalleCompraItemDto {
    @ApiProperty({ example: 1 })
    detalle_id!: number;

    @ApiProperty({ example: 42 })
    item_id!: number;

    @ApiProperty({ example: 'PRO000001' })
    codigo!: string;

    @ApiProperty({ example: 'Cable HDMI 2m' })
    nombre!: string;

    @ApiPropertyOptional({ example: 7, nullable: true })
    lote_id!: number | null;

    @ApiPropertyOptional({ example: '001', nullable: true })
    numero_lote!: string | null;

    @ApiProperty({ example: 10 })
    cantidad!: number;

    @ApiProperty({ example: 8.50 })
    costo_unitario!: number;

    @ApiProperty({ example: 0 })
    descuento_linea!: number;

    @ApiProperty({ example: 85.00 })
    subtotal_linea!: number;

    @ApiPropertyOptional({ example: 12.50, nullable: true })
    precio_venta_sugerido!: number | null;
}

export class GetCompraResponseDto {
    @ApiProperty({ example: 3 })
    compra_id!: number;

    @ApiProperty({ example: '001-001-000000123' })
    numero_documento!: string;

    @ApiProperty({ example: 'FACTURA' })
    tipo_documento!: string;

    @ApiProperty({ example: '2024-06-01T00:00:00.000Z' })
    fecha_emision!: Date;

    // Proveedor
    @ApiProperty({ example: 'REPUESTOS DEL AUSTRO' })
    proveedor!: string;

    @ApiProperty({ example: '0912345678001' })
    proveedor_identificacion!: string;

    @ApiPropertyOptional({ example: 'REPUESTOS AUSTRO', nullable: true })
    proveedor_nombre_comercial!: string | null;

    @ApiPropertyOptional({ example: 'proveedor@mail.com', nullable: true })
    proveedor_email!: string | null;

    @ApiPropertyOptional({ example: '0991234567', nullable: true })
    proveedor_telefono!: string | null;

    @ApiPropertyOptional({ example: 'Ecuador', nullable: true })
    proveedor_pais!: string | null;

    // Financiero
    @ApiProperty({ example: 100.00 })
    subtotal!: number;

    @ApiProperty({ example: 0 })
    descuento_global!: number;

    @ApiProperty({ example: 15 })
    porcentaje_impuesto!: number;

    @ApiProperty({ example: 15.00 })
    valor_impuesto!: number;

    @ApiProperty({ example: 5.00 })
    gastos_envio!: number;

    @ApiProperty({ example: 120.00 })
    total_pagar!: number;

    @ApiProperty({ example: 0 })
    total_pagado!: number;

    @ApiProperty({ example: 120.00, description: 'total_pagar - total_pagado' })
    saldo_pendiente!: number;

    // Estado
    @ApiProperty({ example: 'PENDIENTE' })
    estado_pago!: string;

    // Usuario
    @ApiProperty({ example: 'admin.empresa' })
    usuario_registro!: string;

    @ApiPropertyOptional({ example: 'Entrega en bodega central', nullable: true })
    observaciones!: string | null;

    @ApiProperty({ type: [DetalleCompraItemDto] })
    detalles!: DetalleCompraItemDto[];
}
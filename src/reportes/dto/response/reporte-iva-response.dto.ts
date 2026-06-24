import { ApiProperty } from '@nestjs/swagger';

export class IvaTarifaResumenDto {
    @ApiProperty({ example: 15 })
    tarifa_porcentaje!: number;

    @ApiProperty({ example: 4200.00 })
    base_imponible!: number;

    @ApiProperty({ example: 630.00 })
    iva!: number;

    @ApiProperty({ example: 18 })
    cantidad_registros!: number;
}

export class IvaVentaDetalleDto {
    @ApiProperty({ example: 42 })
    venta_id!: number;

    @ApiProperty({ example: 'FAC-0000001' })
    numero_venta!: string;

    @ApiProperty({ example: '2026-06-05T00:00:00.000Z' })
    fecha_emision!: Date;

    @ApiProperty({ example: 'JUAN PÉREZ' })
    cliente!: string;

    @ApiProperty({ example: '0912345678' })
    identificacion!: string;

    @ApiProperty({ example: 'Cable HDMI 2m' })
    item_nombre!: string;

    @ApiProperty({ example: 2 })
    cantidad!: number;

    @ApiProperty({ example: 12.50 })
    precio_unitario!: number;

    @ApiProperty({ example: 0 })
    descuento!: number;

    @ApiProperty({ example: 25.00 })
    base_imponible!: number;

    @ApiProperty({ example: 15 })
    tarifa_porcentaje!: number;

    @ApiProperty({ example: 3.75 })
    iva_calculado!: number;
}

export class IvaCompraDetalleDto {
    @ApiProperty({ example: 3 })
    compra_id!: number;

    @ApiProperty({ example: '001-001-000000123' })
    numero_documento!: string;

    @ApiProperty({ example: '2026-06-03T00:00:00.000Z' })
    fecha_emision!: Date;

    @ApiProperty({ example: 'REPUESTOS DEL AUSTRO' })
    proveedor!: string;

    @ApiProperty({ example: '0912345678001' })
    proveedor_identificacion!: string;

    @ApiProperty({ example: 100.00 })
    base_imponible!: number;

    @ApiProperty({ example: 15 })
    tarifa_porcentaje!: number;

    @ApiProperty({ example: 15.00 })
    iva!: number;
}

export class ReporteIvaResponseDto {
    @ApiProperty({ example: 6 })
    mes!: number;

    @ApiProperty({ example: 2026 })
    anio!: number;

    @ApiProperty({ type: [IvaTarifaResumenDto] })
    resumen_ventas!: IvaTarifaResumenDto[];

    @ApiProperty({ type: [IvaTarifaResumenDto] })
    resumen_compras!: IvaTarifaResumenDto[];

    @ApiProperty({ example: 630.00 })
    iva_total_ventas!: number;

    @ApiProperty({ example: 270.00 })
    iva_total_compras!: number;

    @ApiProperty({ example: 360.00, description: 'iva_total_ventas - iva_total_compras' })
    iva_a_pagar!: number;

    @ApiProperty({ type: [IvaVentaDetalleDto] })
    detalle_ventas!: IvaVentaDetalleDto[];

    @ApiProperty({ type: [IvaCompraDetalleDto] })
    detalle_compras!: IvaCompraDetalleDto[];
}
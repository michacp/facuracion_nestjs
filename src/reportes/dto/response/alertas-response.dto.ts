import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AlertaFirmaDto {
    @ApiProperty({ example: 1 })
    firmas_id!: number;

    @ApiProperty({ example: 'firma.p12' })
    alias!: string;

    @ApiProperty({ example: '2024-07-01T00:00:00.000Z' })
    fecha_expiracion!: Date;

    @ApiProperty({ example: 15, description: 'Días restantes' })
    dias_restantes!: number;
}

export class AlertaFacturaDto {
    @ApiProperty({ example: 5 })
    factura_id!: number;

    @ApiProperty({ example: 'FAC-0000001' })
    numero_venta!: string;

    @ApiProperty({ example: 'PENDIENTE' })
    estado!: string;

    @ApiProperty({ example: '2024-06-01T00:00:00.000Z' })
    fecha_envio_sri!: Date | null;
}

export class AlertaCompraDto {
    @ApiProperty({ example: 3 })
    compra_id!: number;

    @ApiProperty({ example: '001-001-000000123' })
    numero_documento!: string;

    @ApiProperty({ example: 'REPUESTOS DEL AUSTRO' })
    proveedor!: string;

    @ApiProperty({ example: 500.00 })
    saldo_pendiente!: number;

    @ApiProperty({ example: 'PENDIENTE' })
    estado_pago!: string;
}

export class AlertasResponseDto {
    @ApiProperty({ type: [AlertaFirmaDto] })
    firmas_por_vencer!: AlertaFirmaDto[];

    @ApiProperty({ type: [AlertaFacturaDto] })
    facturas_pendientes!: AlertaFacturaDto[];

    @ApiProperty({ type: [AlertaCompraDto] })
    compras_por_pagar!: AlertaCompraDto[];

    @ApiProperty({ example: 5, description: 'Total de alertas activas' })
    total_alertas!: number;
}
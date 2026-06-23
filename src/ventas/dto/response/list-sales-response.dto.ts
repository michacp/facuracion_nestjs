import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaleListItemDetailDto {
    @ApiProperty({ example: 'PRO000001' })
    code!: string;

    @ApiProperty({ example: 'Cable HDMI 2m' })
    name!: string;

    @ApiPropertyOptional({ example: '001', nullable: true, description: 'null = servicio' })
    lot!: string | null;

    @ApiProperty({ example: false })
    es_servicio!: boolean;
}

export class SaleListItemDto {
    @ApiProperty({ example: 42 })
    sale_id!: number;

    @ApiProperty({ example: 'FAC-0000001' })
    sale_number!: string;

    @ApiProperty({ example: 'JUAN PÉREZ' })
    customer!: string;

    @ApiProperty({ example: '2024-06-01T00:00:00.000Z' })
    issue_date!: Date;

    @ApiProperty({ example: 'FACTURA' })
    document_type!: string;

    @ApiProperty({ example: 'EFECTIVO' })
    payment_method!: string;

    @ApiProperty({ example: 115.00 })
    total_amount!: number;

    @ApiProperty({ type: [SaleListItemDetailDto] })
    items!: SaleListItemDetailDto[];
}

export class TipoComprobanteItemDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'FACTURA' })
    name!: string;
}

export class ListSalesResponseDto {
    @ApiProperty({ example: 100 })
    total!: number;

    @ApiProperty({ type: [SaleListItemDto] })
    sales!: SaleListItemDto[];

    @ApiProperty({ type: [TipoComprobanteItemDto] })
    tiposComprobante!: TipoComprobanteItemDto[];
}
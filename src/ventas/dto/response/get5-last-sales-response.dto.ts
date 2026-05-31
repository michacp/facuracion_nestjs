import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaleDetailItemDto {
    @ApiProperty({ example: 1 })
    detailId!: number;

    @ApiProperty({ example: 'PRO000001 - CABLE HDMI [iPhone 14 Pro]' })
    productName!: string;

    @ApiProperty({ example: 2 })
    quantity!: number;

    @ApiProperty({ example: 12.50 })
    unitPrice!: number;

    @ApiProperty({ example: 0 })
    discount!: number;

    @ApiProperty({ example: 'IVA 15%' })
    taxName!: string;

    @ApiProperty({ example: 15.00 })
    taxPercentage!: number;

    @ApiProperty({ description: 'true = servicio sin inventario', example: false })
    es_servicio!: boolean;
}

export class Get5LastSalesResponseDto {
    @ApiProperty({ example: 42 })
    saleId!: number;

    @ApiProperty({ example: 'FAC-0000001' })
    saleNumber!: string;

    @ApiProperty({ example: '2024-06-01T00:00:00.000Z' })
    issueDate!: Date;

    @ApiProperty({ example: 115.00 })
    totalAmount!: number;

    @ApiProperty({ type: [SaleDetailItemDto] })
    items!: SaleDetailItemDto[];
}
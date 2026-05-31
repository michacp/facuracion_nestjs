import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockBajoItemDto {
    @ApiProperty({ example: 42 })
    item_id!: number;

    @ApiProperty({ example: 'PRO000001' })
    codigo!: string;

    @ApiProperty({ example: 'Cable HDMI 2m' })
    nombre!: string;

    @ApiProperty({ example: 3 })
    stock_total!: number;

    @ApiProperty({ example: 5, description: 'Umbral configurado' })
    umbral!: number;

    @ApiPropertyOptional({ example: 'iPhone 14, Galaxy S24', nullable: true })
    modelos!: string | null;
}

export class StockBajoResponseDto {
    @ApiProperty({ example: 4 })
    total!: number;

    @ApiProperty({ type: [StockBajoItemDto] })
    items!: StockBajoItemDto[];
}
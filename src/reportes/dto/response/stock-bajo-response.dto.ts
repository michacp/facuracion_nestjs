// src/reportes/dto/response/stock-bajo-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockBajoItemDto {
    @ApiProperty({ example: 42 })
    item_id!: number;

    @ApiProperty({ example: 'PRO000001' })
    codigo!: string;

    @ApiProperty({ example: 'Pantalla' })
    nombre!: string;

    @ApiProperty({ example: 3 })
    stock_total!: number;

    @ApiProperty({ example: 5, description: 'Umbral configurado' })
    umbral!: number;

    @ApiPropertyOptional({
        example: ['Samsung - A15', 'Samsung - A16'],
        type: [String],
        nullable: true,
    })
    modelos!: string[] | null;
}

export class StockBajoResponseDto {
    @ApiProperty({ example: 23, description: 'Total de items con stock bajo (todas las páginas)' })
    total!: number;

    @ApiProperty({ example: 0 })
    page!: number;

    @ApiProperty({ example: 30 })
    limit!: number;

    @ApiProperty({ example: 1 })
    totalPages!: number;

    @ApiProperty({ type: [StockBajoItemDto] })
    items!: StockBajoItemDto[];
}
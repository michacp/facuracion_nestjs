// src/reportes/dto/request/stock-bajo-body.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class StockBajoQueryDto {
    @ApiPropertyOptional({ example: 5, description: 'Umbral configurado' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    umbral?: number = 5;

    @ApiPropertyOptional({ example: 0, description: 'Página (inicia en 0)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    page?: number = 0;

    @ApiPropertyOptional({ example: 30 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 30;
}
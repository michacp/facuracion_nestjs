import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListComprasBodyDto {
    @ApiPropertyOptional({ example: '001-001-000000123', description: 'N° documento o razón social proveedor' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ example: '2024-01-01' })
    @IsDateString()
    @IsOptional()
    fechaDesde?: string;

    @ApiPropertyOptional({ example: '2024-12-31' })
    @IsDateString()
    @IsOptional()
    fechaHasta?: string;

    @ApiPropertyOptional({ example: 'PENDIENTE', description: 'Filtrar por estado de pago' })
    @IsString()
    @IsOptional()
    estadoPago?: string;

    @ApiPropertyOptional({ example: 0, default: 0 })
    @IsInt()
    @Min(0)
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @ApiPropertyOptional({ example: 30, default: 30 })
    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    limit?: number;
}
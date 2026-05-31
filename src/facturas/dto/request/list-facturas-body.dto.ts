import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListFacturasBodyDto {
    @ApiPropertyOptional({ example: 'FAC-0000001', description: 'Número de venta o clave de acceso' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ example: 'AUTORIZADO', description: 'Filtrar por estado SRI' })
    @IsString()
    @IsOptional()
    estado?: string;

    @ApiPropertyOptional({ example: '2024-01-01' })
    @IsDateString()
    @IsOptional()
    fechaDesde?: string;

    @ApiPropertyOptional({ example: '2024-12-31' })
    @IsDateString()
    @IsOptional()
    fechaHasta?: string;

    @ApiPropertyOptional({ example: 0, default: 0 })
    @IsInt()
    @Min(0)
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @ApiPropertyOptional({ example: 10, default: 10 })
    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    limit?: number;
}
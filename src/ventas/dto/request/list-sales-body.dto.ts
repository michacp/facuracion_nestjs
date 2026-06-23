import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional, IsString, IsInt, IsDateString,
    Min, IsObject, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SalesFiltersDto {
    @ApiPropertyOptional({ example: '', description: 'Texto de búsqueda' })
    @IsString()
    @IsOptional()
    searchQuery?: string;

    @ApiPropertyOptional({ example: 1, description: 'ID del tipo de comprobante' })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    tipo_comprobante_id?: number;

    @ApiPropertyOptional({ example: '2024-01-01' })
    @IsDateString()
    @IsOptional()
    fechaDesde?: string;

    @ApiPropertyOptional({ example: '2024-12-31' })
    @IsDateString()
    @IsOptional()
    fechaHasta?: string;

    @ApiPropertyOptional({ example: 0, description: 'Índice de página (0-based)' })
    @IsInt()
    @Min(0)
    @IsOptional()
    @Type(() => Number)
    pageIndex?: number;

    @ApiPropertyOptional({ example: 30, description: 'Cantidad de registros por página' })
    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    pageSize?: number;
}

export class ListSalesBodyDto {
    @ApiPropertyOptional({ type: () => SalesFiltersDto })
    @IsObject()
    @ValidateNested()
    @Type(() => SalesFiltersDto)
    filters?: SalesFiltersDto;
}
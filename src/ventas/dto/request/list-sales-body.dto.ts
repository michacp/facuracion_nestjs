import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SalesFiltersDto {
    @ApiPropertyOptional({ example: '', description: 'Texto de búsqueda' })
    @IsString()
    @IsOptional()
    searchQuery?: string;

    @ApiPropertyOptional({ example: '', description: 'Forma de pago' })
    @IsString()
    @IsOptional()
    forma_pago?: string;

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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListItemsBodyDto {
    @ApiPropertyOptional({ example: 'cable', description: 'Búsqueda por nombre, marca o modelo. Si es numérico busca por código auxiliar' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ example: 1, description: 'ID del tipo de ítem (categoría)' })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    category?: number;

    @ApiPropertyOptional({ example: 0, description: 'Página (base 0)', default: 0 })
    @IsInt()
    @Min(0)
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @ApiPropertyOptional({ example: 10, description: 'Registros por página', default: 10 })
    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    limit?: number;
}
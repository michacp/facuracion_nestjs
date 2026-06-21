import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListClientesBodyDto {
    @ApiPropertyOptional({
        example: 'an or',
        description:
            'Búsqueda libre. Cada palabra es un filtro independiente (AND de ORs). ' +
            'Ejemplo: "an or" → encuentra "Andrés Orellana". ' +
            'También busca por cédula/RUC.',
    })
    @IsString()
    @IsOptional()
    search?: string;

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
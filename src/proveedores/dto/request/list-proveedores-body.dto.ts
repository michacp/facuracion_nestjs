import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListProveedoresBodyDto {
    @ApiPropertyOptional({
        example: 'rep austro',
        description: 'Búsqueda libre por razón social, nombre comercial o identificación (AND de palabras)',
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
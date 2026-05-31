import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class FindProductsIdNameBodyDto {
    @ApiPropertyOptional({
        description:
            'Búsqueda opcional. Numérica → busca por código auxiliar con padding. ' +
            'Texto → busca en nombre, modelo o marca. ' +
            'Sin valor → retorna los últimos 50 lotes.',
        example: 'cable',
    })
    @IsString()
    @IsOptional()
    search?: string;
}
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FindItemsPurchaseBodyDto {
    @ApiPropertyOptional({
        description: 'Búsqueda por nombre, código, marca o modelo. Vacío = últimos 50',
        example: 'cable',
    })
    @IsString()
    @IsOptional()
    search?: string;
}
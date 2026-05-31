import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

// find-proveedor-body.dto.ts — search opcional
export class FindProveedorBodyDto {
    @ApiPropertyOptional({
        description: 'Búsqueda. Vacío = últimos 20 proveedores',
        example: 'PROVEEDOR',
    })
    @IsString()
    @IsOptional()
    search?: string;
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt, IsPositive, IsString,
    IsNotEmpty, IsOptional, MaxLength,
    IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CampoAdicionalDto } from './save-client-body.dto';

export class EditClientBodyDto {
    @ApiProperty({ description: 'ID del cliente a editar', example: 15 })
    @IsInt()
    @IsPositive()
    id!: number;

    @ApiProperty({ example: 'JUAN PÉREZ ACTUALIZADO' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    razonSocial!: string;

    @ApiPropertyOptional({ example: 'Av. Siempre Viva 456' })
    @IsString()
    @IsOptional()
    direccion?: string;

    @ApiPropertyOptional({ example: 'nuevo@example.com' })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    email?: string;

    @ApiPropertyOptional({ example: '0997654321' })
    @IsString()
    @IsOptional()
    @MaxLength(20)
    telefono?: string;

    @ApiPropertyOptional({
        description: 'Sync completo de campos adicionales — reemplaza todos los existentes',
        type: [CampoAdicionalDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CampoAdicionalDto)
    @IsOptional()
    camposAdicionales?: CampoAdicionalDto[];
}
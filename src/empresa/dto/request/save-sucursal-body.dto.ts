import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean, IsOptional, IsString,
    MaxLength, IsNotEmpty,
} from 'class-validator';

export class SaveSucursalBodyDto {
    @ApiPropertyOptional({ description: 'null = crear, número = editar' })
    @IsOptional()
    sucursales_id?: number;

    @ApiProperty({ example: '002' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    sucursales_cod!: string;

    @ApiProperty({ example: 'SUCURSAL NORTE' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    sucursales_nombre!: string;

    @ApiProperty({ example: 'Av. Norte 789' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    sucursales_direccion!: string;

    @ApiPropertyOptional({ example: '0991234567' })
    @IsString()
    @IsOptional()
    @MaxLength(20)
    sucursales_telefono?: string;

    @ApiPropertyOptional({ example: false })
    @IsBoolean()
    @IsOptional()
    sucursales_esMatriz?: boolean;
}
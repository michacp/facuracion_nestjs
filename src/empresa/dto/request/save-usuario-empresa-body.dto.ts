import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail, IsInt, IsNotEmpty, IsOptional,
    IsPositive, IsString, MaxLength, MinLength,
} from 'class-validator';

export class SaveUsuarioEmpresaBodyDto {
    // Si es nuevo usuario
    @ApiPropertyOptional({ description: 'null = crear usuario nuevo' })
    @IsOptional()
    usuario_empresa_id?: number;

    @ApiProperty({ example: 'nuevo.usuario' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    username!: string;

    @ApiProperty({ example: 'Nombre Completo' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre!: string;

    @ApiProperty({ example: 'usuario@empresa.com' })
    @IsEmail()
    email!: string;

    @ApiPropertyOptional({ example: 'password123', description: 'Requerido si es nuevo usuario' })
    @IsString()
    @IsOptional()
    @MinLength(6)
    password?: string;

    @ApiProperty({ example: 2, description: 'ID del rol' })
    @IsInt()
    @IsPositive()
    rol_id!: number;

    @ApiProperty({ example: '001', description: 'Código emisor' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    cod_emisor!: string;
}
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean, IsEmail, IsInt, IsOptional,
    IsPositive, IsString, MaxLength,
} from 'class-validator';

export class UpdateEmpresaBodyDto {
    @ApiPropertyOptional({ example: 'EMPRESA S.A.' })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    empresas_razonSocial?: string;

    @ApiPropertyOptional({ example: 'EMPRESA', nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    empresas_nombreComercial?: string;

    // RUC NO es editable — no está en el DTO

    @ApiPropertyOptional({ example: 'Av. Nueva 456' })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    empresas_dirMatriz?: string;

    @ApiPropertyOptional({ example: '0991234567' })
    @IsString()
    @IsOptional()
    @MaxLength(20)
    empresas_telefono?: string;

    @ApiPropertyOptional({ example: 'nuevo@empresa.com' })
    @IsEmail()
    @IsOptional()
    @MaxLength(100)
    empresa_email?: string;

    @ApiPropertyOptional({ example: false })
    @IsBoolean()
    @IsOptional()
    empresas_obligadocontabilidad?: boolean;

    @ApiPropertyOptional({ example: false })
    @IsBoolean()
    @IsOptional()
    empresas_agenteRetencion?: boolean;

    @ApiPropertyOptional({ example: 1 })
    @IsInt()
    @IsPositive()
    @IsOptional()
    empresas_regimenes_id?: number;
}
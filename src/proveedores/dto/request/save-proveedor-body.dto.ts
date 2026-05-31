import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt, IsPositive, IsString,
    IsNotEmpty, IsOptional, MaxLength, Length,
} from 'class-validator';

export class SaveProveedorBodyDto {
    @ApiProperty({ description: 'Número de identificación', example: '0912345678001' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    identificacion!: string;

    @ApiProperty({ description: 'Código SRI del tipo de identificación', example: '04' })
    @IsString()
    @IsNotEmpty()
    @Length(2, 2)
    tipoIdentificacion!: string;

    @ApiProperty({ description: 'Razón social', example: 'PROVEEDOR S.A.' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    razonSocial!: string;

    @ApiPropertyOptional({ example: 'PROV S.A.' })
    @IsString()
    @IsOptional()
    @MaxLength(150)
    nombreComercial?: string;

    @ApiProperty({ description: 'ID del país', example: 1 })
    @IsInt()
    @IsPositive()
    paisId!: number;

    @ApiPropertyOptional({ example: 'Av. Principal 123' })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    direccion?: string;

    @ApiPropertyOptional({ example: '0991234567' })
    @IsString()
    @IsOptional()
    @MaxLength(20)
    telefono?: string;

    @ApiPropertyOptional({ example: 'proveedor@mail.com' })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    email?: string;
}
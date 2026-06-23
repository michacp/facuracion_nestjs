import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt, IsPositive, IsString,
    IsNotEmpty, IsOptional, MaxLength, Length,
} from 'class-validator';

export class UpdateProveedorBodyDto {
    @ApiProperty({ example: 5 })
    @IsInt()
    @IsPositive()
    proveedor_id!: number;

    @ApiProperty({ example: '0912345678001' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    identificacion!: string;

    @ApiProperty({ example: '04' })
    @IsString()
    @IsNotEmpty()
    @Length(2, 2)
    tipoIdentificacion!: string;

    @ApiProperty({ example: 'PROVEEDOR S.A.' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    razonSocial!: string;

    @ApiPropertyOptional({ example: 'PROV S.A.' })
    @IsString()
    @IsOptional()
    @MaxLength(150)
    nombreComercial?: string;

    @ApiProperty({ example: 1 })
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
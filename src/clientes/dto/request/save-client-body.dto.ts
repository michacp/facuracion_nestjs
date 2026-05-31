import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString, IsNotEmpty, IsOptional,
    MaxLength, Length, IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CampoAdicionalDto {
    @ApiProperty({ description: 'Clave del campo', example: 'lugar_entrega' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    clave!: string;

    @ApiProperty({ description: 'Valor del campo', example: 'Bodega Central' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    valor!: string;
}

export class SaveClientBodyDto {
    @ApiProperty({ example: '0912345678' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    identificacion!: string;

    @ApiProperty({ example: '04' })
    @IsString()
    @IsNotEmpty()
    @Length(2, 2)
    tipoIdentificacion!: string;

    @ApiProperty({ example: 'JUAN PÉREZ' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    razonSocial!: string;

    @ApiPropertyOptional({ example: 'Av. Siempre Viva 123' })
    @IsString()
    @IsOptional()
    direccion?: string;

    @ApiPropertyOptional({ example: 'juan@example.com' })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    email?: string;

    @ApiPropertyOptional({ example: '0991234567' })
    @IsString()
    @IsOptional()
    @MaxLength(20)
    telefono?: string;

    @ApiPropertyOptional({
        description: 'Campos adicionales opcionales (ej: lugar_entrega, contacto)',
        type: [CampoAdicionalDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CampoAdicionalDto)
    @IsOptional()
    camposAdicionales?: CampoAdicionalDto[];
}
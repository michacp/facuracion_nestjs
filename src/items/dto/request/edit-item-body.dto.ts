import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt,
    IsPositive,
    IsString,
    IsNotEmpty,
    IsOptional,
    IsArray,
    IsNumber,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EditLoteDto {
    @ApiProperty({ description: 'ID del lote a actualizar', example: 1 })
    @IsInt()
    @IsPositive()
    lote_id!: number;

    @ApiProperty({ description: 'Nueva cantidad del lote', example: 15 })
    @IsInt()
    @Min(0)
    cantidad!: number;
}

export class EditItemBodyDto {
    @ApiProperty({ description: 'ID del ítem a editar', example: 42 })
    @IsInt()
    @IsPositive()
    id!: number;

    @ApiProperty({ description: 'Nombre del ítem', example: 'Cable HDMI 2m' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre!: string;

    @ApiPropertyOptional({ description: 'Descripción del ítem', example: 'Cable de alta velocidad' })
    @IsString()
    @IsOptional()
    descripcion?: string;

    @ApiProperty({ description: 'Precio unitario', example: 12.50 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    precio_unitario!: number;

    @ApiProperty({ description: 'ID de la tarifa de impuesto', example: 2 })
    @IsInt()
    @IsPositive()
    id_tarifa_impuesto!: number;

    @ApiProperty({
        description: 'IDs de modelos compatibles — se sincroniza: agrega los nuevos y elimina los que falten',
        example: [3, 7],
        type: [Number],
    })
    @IsArray()
    @IsInt({ each: true })
    @IsPositive({ each: true })
    modelos_ids!: number[];

    @ApiPropertyOptional({
        description: 'Lotes a actualizar (solo cantidad)',
        type: [EditLoteDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EditLoteDto)
    @IsOptional()
    lotes?: EditLoteDto[];
}
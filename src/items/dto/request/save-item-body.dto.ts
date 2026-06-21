import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt, IsPositive, IsString, IsNotEmpty,
    IsOptional, IsArray, IsNumber, Min, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SaveItemBodyDto {
    @ApiProperty({ description: 'ID del tipo de ítem (1=Producto, 2=Servicio)', example: 1 })
    @IsInt()
    @IsPositive()
    tipo_item!: number;

    @ApiProperty({ description: 'ID de la tarifa de impuesto', example: 2 })
    @IsInt()
    @IsPositive()
    id_tarifa_impuesto!: number;

    @ApiProperty({ description: 'Nombre del ítem', example: 'Cable HDMI 2m' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre!: string;

    @ApiPropertyOptional({ description: 'Descripción del ítem' })
    @IsString()
    @IsOptional()
    descripcion?: string;

    @ApiProperty({ description: 'Precio unitario', example: 12.50 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    precio_unitario!: number;

    @ApiPropertyOptional({
        description: 'Stock inicial — ignorado si tipo_item = 2 (Servicio)',
        example: 10,
    })


    @ApiPropertyOptional({
        description: 'IDs de modelos compatibles',
        example: [3, 7],
        type: [Number],
    })
    @IsArray()
    @IsInt({ each: true })
    @IsPositive({ each: true })
    @IsOptional()
    modelos_ids?: number[];
}
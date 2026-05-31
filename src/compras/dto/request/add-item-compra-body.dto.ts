import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt, IsPositive, IsNumber, IsOptional, Min, IsBoolean,
} from 'class-validator';

export class AddItemCompraBodyDto {
    @ApiProperty({ example: 3 })
    @IsInt()
    @IsPositive()
    compra_id!: number;

    @ApiProperty({ example: 42 })
    @IsInt()
    @IsPositive()
    item_id!: number;

    @ApiProperty({ example: 10 })
    @IsInt()
    @Min(1)
    cantidad!: number;

    @ApiProperty({ example: 8.50 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    costo_unitario!: number;

    @ApiPropertyOptional({ example: 0.50 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @IsOptional()
    descuento_linea?: number;

    @ApiPropertyOptional({ example: 12.50 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    @IsOptional()
    precio_venta_sugerido?: number;

    @ApiPropertyOptional({ example: false })
    @IsBoolean()
    @IsOptional()
    aplicar_pvp?: boolean;
}
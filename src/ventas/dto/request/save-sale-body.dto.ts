import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray, IsBoolean, IsDateString, IsInt, IsNotEmpty,
    IsNumber, IsOptional, IsPositive, IsString,
    Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductoVentaDto {
    @ApiProperty({ description: 'lote_id para productos | item_id para servicios', example: 3 })
    @IsInt()
    @IsPositive()
    productoId!: number;

    // CORRECCIÓN: Se añadió @IsBoolean y tipo 'boolean' para Swagger
    @ApiProperty({ description: 'true = servicio (sin descuento de stock)', type: Boolean, example: true })
    @IsBoolean()
    es_servicio!: boolean;

    @ApiProperty({ example: 1 })
    @IsInt()
    @Min(1)
    cantidad!: number;

    @ApiProperty({ example: 120.00 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    precioUnitario!: number;

    @ApiProperty({ example: 0 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    descuento!: number;

    @ApiProperty({ description: 'ID de la tarifa de impuesto', example: 1 })
    @IsInt()
    @IsPositive()
    codigoImpuesto!: number;
}

export class SaveSaleBodyDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    @IsPositive()
    clienteId!: number;

    // NOTA: Asegúrate de que el cliente envíe formato ISO (e.g., '2026-05-26T00:15:51.000Z')
    @ApiProperty({ example: '2026-05-26T00:15:51.000Z' })
    @IsDateString()
    fechaEmision!: string;

    @ApiProperty({ description: 'ID del tipo de comprobante', example: 1 })
    @IsInt()
    @IsPositive()
    tipoComprobante!: number;

    @ApiProperty({ example: 'USD' })
    @IsString()
    @IsNotEmpty()
    moneda!: string;

    @ApiProperty({ description: 'ID de la forma de pago', example: 1 })
    @IsInt()
    @IsPositive()
    formaPago!: number;

    @ApiPropertyOptional({ example: '' })
    @IsString()
    @IsOptional()
    plazoPago?: string;

    @ApiPropertyOptional({ example: '' })
    @IsString()
    @IsOptional()
    observaciones?: string;

    @ApiProperty({ example: 120.00 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    subtotal!: number;

    @ApiProperty({ example: 0 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    descuentoTotal!: number;

    @ApiProperty({ example: 0 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    iva!: number;

    @ApiProperty({ example: 0 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    propina!: number;

    @ApiProperty({ example: 120.00 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    total!: number;

    @ApiProperty({ type: [ProductoVentaDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductoVentaDto)
    productos!: ProductoVentaDto[];
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray, IsDateString, IsInt, IsNotEmpty,
    IsNumber, IsOptional, IsPositive, IsString,
    Min, ValidateNested, IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DetalleCompraDto {
    @ApiProperty({ description: 'ID del ítem', example: 42 })
    @IsInt()
    @IsPositive()
    item_id!: number;

    @ApiProperty({ example: 10 })
    @IsInt()
    @Min(1)
    cantidad!: number;

    @ApiProperty({ example: 8.50, description: 'Costo unitario de compra' })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    costo_unitario!: number;

    @ApiPropertyOptional({ example: 0.50, description: 'Descuento por línea' })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @IsOptional()
    descuento_linea?: number;

    @ApiPropertyOptional({ example: 12.50, description: 'PVP sugerido para este ítem' })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    @IsOptional()
    precio_venta_sugerido?: number;

    @ApiPropertyOptional({
        example: true,
        description: 'Si true, actualiza item_precio_unitario con el PVP sugerido',
    })
    @IsBoolean()
    @IsOptional()
    aplicar_pvp?: boolean;
}

export class SaveCompraBodyDto {
    @ApiProperty({ example: 5, description: 'ID del proveedor' })
    @IsInt()
    @IsPositive()
    proveedor_id!: number;

    @ApiProperty({ example: 1, description: 'ID del tipo de documento' })
    @IsInt()
    @IsPositive()
    tipo_doc_id!: number;

    @ApiProperty({ example: '001-001-000000123' })
    @IsString()
    @IsNotEmpty()
    numero_documento!: string;

    @ApiProperty({ example: '2024-06-01' })
    @IsDateString()
    fecha_emision!: string;

    @ApiProperty({ example: 100.00 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    subtotal!: number;

    @ApiPropertyOptional({ example: 0 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @IsOptional()
    descuento_global?: number;

    @ApiPropertyOptional({ example: 15, description: 'Porcentaje IVA de la compra' })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @IsOptional()
    porcentaje_impuesto?: number;

    @ApiPropertyOptional({ example: 15.00 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @IsOptional()
    valor_impuesto?: number;

    @ApiPropertyOptional({ example: 5.00, description: 'Gastos de envío / logística' })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @IsOptional()
    gastos_envio?: number;

    @ApiProperty({ example: 120.00 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    total_pagar!: number;

    @ApiPropertyOptional({ example: 'Entrega en bodega central' })
    @IsString()
    @IsOptional()
    observaciones?: string;

    @ApiProperty({ type: [DetalleCompraDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DetalleCompraDto)
    detalles!: DetalleCompraDto[];
    @ApiPropertyOptional({ description: 'ID del estado de pago (enviado por error desde el cliente)' })
    @IsInt()
    @IsOptional()
    estado_pago_id?: number;
}
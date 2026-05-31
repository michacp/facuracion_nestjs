import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TipoImpuestoDto {
    @ApiProperty({ example: '2' })
    codigo_sri!: string;

    @ApiProperty({ example: 'IVA' })
    nombre!: string;
}

export class TarifaImpuestoDto {
    @ApiProperty({ example: '2' })
    tarifa_codigo_sri!: string;

    @ApiProperty({ example: 15 })
    tarifa_porcentaje!: number;

    @ApiProperty({ example: 'IVA 15%' })
    tarifa_nombre!: string;

    @ApiProperty({ type: TipoImpuestoDto })
    tipo_impuesto!: TipoImpuestoDto;
}

export class ModeloDto {
    @ApiProperty({ example: 12 })
    models_id!: number;

    @ApiProperty({ example: 'iPhone 14 Pro' })
    models_name!: string;

    @ApiProperty({ example: 'iphone-14-pro' })
    models_find_id!: string;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/img.png', nullable: true })
    models_img_url!: string | null;
}

export class LoteDto {
    @ApiProperty({ example: 1 })
    lote_id!: number;

    @ApiProperty({ example: '001' })
    numero_lote!: string;

    @ApiProperty({ example: 10 })
    cantidad!: number;

    @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
    fecha_ingreso!: Date;
}

export class FindOneItemResponseDto {
    @ApiProperty({ example: 42 })
    item_id!: number;

    @ApiProperty({ example: 'PRO000001' })
    item_codigo_principal!: string;

    @ApiProperty({ example: 'Cable HDMI 2m' })
    item_nombre!: string;

    @ApiPropertyOptional({ example: 'Cable de alta velocidad', nullable: true })
    item_descripcion!: string | null;

    @ApiProperty({ example: 12.50 })
    item_precio_unitario!: number;

    @ApiProperty({ type: TarifaImpuestoDto })
    tarifa_impuesto!: TarifaImpuestoDto;

    @ApiProperty({ type: [ModeloDto] })
    modelos!: ModeloDto[];

    @ApiProperty({ type: [LoteDto] })
    lotes!: LoteDto[];
}
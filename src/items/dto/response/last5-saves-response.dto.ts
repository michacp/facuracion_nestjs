import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Last5SavesItemDto {
    @ApiProperty({ example: 42 })
    id!: number;

    @ApiProperty({ example: 'Cable HDMI 2m' })
    nombre!: string;

    @ApiProperty({ example: 'PRO000001' })
    codigo!: string;

    @ApiProperty({ example: 12.50 })
    precio!: number;

    @ApiPropertyOptional({
        description: 'Stock total sumado de todos los lotes. null = servicio sin inventario',
        example: 10,
        nullable: true,
    })
    stock!: number | null;

    @ApiProperty({ example: 'PRODUCTO' })
    tipo_nombre!: string;

    @ApiProperty({ example: 'IVA 15%' })
    impuesto_nombre!: string;

    @ApiProperty({ example: 'IVA' })
    impuesto_tipo_nombre!: string;

    @ApiPropertyOptional({ example: 'iPhone 14 Pro, Galaxy S24', nullable: true })
    modelos!: string | null;

    @ApiPropertyOptional({ example: 'Apple, Samsung', nullable: true })
    marcas!: string | null;

    @ApiProperty({ description: 'true = servicio sin inventario', example: false })
    es_servicio!: boolean;
}
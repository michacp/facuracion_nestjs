import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FindProductsIdNameResponseDto {
    @ApiProperty({ description: 'lote_id para productos | item_id para servicios', example: 7 })
    id!: number;

    @ApiProperty({
        example: 'PRO000001 - 001 - CABLE HDMI 2M [iPhone 14 Pro] (10)  $12.50',
    })
    name!: string;

    @ApiProperty({ example: 12.50 })
    price!: number;

    @ApiPropertyOptional({
        description: 'Stock disponible. null = servicio (sin límite de inventario)',
        example: 10,
        nullable: true,
    })
    stock!: number | null;

    @ApiProperty({ example: 2 })
    tax_percentage_id!: number;

    @ApiProperty({
        description: 'Indica si es un servicio (sin inventario)',
        example: false,
    })
    es_servicio!: boolean;
}
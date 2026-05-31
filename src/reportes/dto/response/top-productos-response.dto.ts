import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopProductoDto {
    @ApiProperty({ example: 42 })
    item_id!: number;

    @ApiProperty({ example: 'PRO000001' })
    codigo!: string;

    @ApiProperty({ example: 'Cable HDMI 2m' })
    nombre!: string;

    @ApiProperty({ example: 45, description: 'Unidades vendidas en el mes' })
    unidades_vendidas!: number;

    @ApiProperty({ example: 562.50, description: 'Total facturado' })
    total_facturado!: number;

    @ApiPropertyOptional({ example: 'Apple, Samsung', nullable: true })
    marcas!: string | null;
}

export class TopProductosResponseDto {
    @ApiProperty({ type: [TopProductoDto] })
    productos!: TopProductoDto[];

    @ApiProperty({ example: 'mes', description: 'Período consultado' })
    periodo!: string;
}
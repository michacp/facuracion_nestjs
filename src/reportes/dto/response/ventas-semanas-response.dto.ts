import { ApiProperty } from '@nestjs/swagger';

export class SemanaPuntoDto {
    @ApiProperty({ example: 'Sem 1' })
    label!: string;

    @ApiProperty({ example: '2024-01-01' })
    fecha_inicio!: string;

    @ApiProperty({ example: '2024-01-07' })
    fecha_fin!: string;

    @ApiProperty({ example: 4500.00 })
    total_ventas!: number;

    @ApiProperty({ example: 12 })
    count_ventas!: number;

    @ApiProperty({ example: 2100.00 })
    total_compras!: number;

    @ApiProperty({ example: 5 })
    count_compras!: number;
}

export class VentasSemanasResponseDto {
    @ApiProperty({ type: [SemanaPuntoDto] })
    semanas!: SemanaPuntoDto[];
}
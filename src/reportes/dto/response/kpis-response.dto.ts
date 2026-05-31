import { ApiProperty } from '@nestjs/swagger';

export class KpiPeriodoDto {
    @ApiProperty({ example: 1250.00 })
    ventas_total!: number;

    @ApiProperty({ example: 8 })
    ventas_count!: number;

    @ApiProperty({ example: 800.00 })
    compras_total!: number;

    @ApiProperty({ example: 3 })
    compras_count!: number;

    @ApiProperty({ example: 450.00, description: 'ventas - compras' })
    utilidad_bruta!: number;
}

export class KpisResponseDto {
    @ApiProperty({ type: KpiPeriodoDto })
    semana!: KpiPeriodoDto;

    @ApiProperty({ type: KpiPeriodoDto })
    mes!: KpiPeriodoDto;

    @ApiProperty({ type: KpiPeriodoDto })
    anio!: KpiPeriodoDto;
}
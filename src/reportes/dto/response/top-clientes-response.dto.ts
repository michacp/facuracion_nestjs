import { ApiProperty } from '@nestjs/swagger';

export class TopClienteDto {
    @ApiProperty({ example: 15 })
    cliente_id!: number;

    @ApiProperty({ example: 'JUAN PÉREZ' })
    razon_social!: string;

    @ApiProperty({ example: '0912345678' })
    identificacion!: string;

    @ApiProperty({ example: 8, description: 'Cantidad de compras en el período' })
    total_compras!: number;

    @ApiProperty({ example: 1250.00, description: 'Total facturado' })
    total_facturado!: number;
}

export class TopClientesResponseDto {
    @ApiProperty({ type: [TopClienteDto] })
    clientes!: TopClienteDto[];

    @ApiProperty({ example: 'mes' })
    periodo!: string;
}
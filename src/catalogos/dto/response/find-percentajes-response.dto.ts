import { ApiProperty } from '@nestjs/swagger';

// Elimina FindPercentajesResponseDto, solo exporta el item
export class TarifaItemDto {
    @ApiProperty({ example: 2 })
    id!: number;

    @ApiProperty({ example: 'IVA 15%' })
    name!: string;

    @ApiProperty({ example: '2', description: 'Código SRI de la tarifa' })
    codigoSri!: string;

    @ApiProperty({ example: 15.00, description: 'Porcentaje de la tarifa' })
    porcentaje!: number;

    @ApiProperty({ example: 'Tarifa general de IVA' })
    descripcion!: string;
}
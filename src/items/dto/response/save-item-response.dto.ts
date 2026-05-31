import { ApiProperty } from '@nestjs/swagger';

export class SaveItemResponseDto {
    @ApiProperty({ example: 42 })
    itemId!: number;

    @ApiProperty({ example: 'Cable HDMI 2m' })
    name!: string;

    @ApiProperty({ example: 'PRO000001' })
    cod!: string;

    @ApiProperty({
        description: 'Indica si es un servicio (sin inventario)',
        example: false,
    })
    es_servicio!: boolean;
}
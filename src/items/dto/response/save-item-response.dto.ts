//src\items\dto\response\save-item-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class SaveItemResponseDto {
    @ApiProperty({ example: 42 })
    itemId!: number;

    @ApiProperty({
        example: 42,
        description: 'Igual a itemId — para usar la respuesta directamente en selectores {id, name}',
    })
    id!: number;

    @ApiProperty({ example: 'Cable HDMI 2m' })
    name!: string;

    @ApiProperty({ example: 'PRO000001' })
    cod!: string;

    @ApiProperty({
        description: 'Indica si es un servicio (sin inventario)',
        example: false,
    })
    es_servicio!: boolean;

    @ApiProperty({
        example: 12.50,
        description: 'Precio unitario — mismo campo que devuelve find-for-purchase',
    })
    precio_actual!: number;
}
//src\items\dto\response\find-items-purchase-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class FindItemsPurchaseResponseDto {
    @ApiProperty({ example: 42 })
    id!: number;

    @ApiProperty({ example: 'PRO000001 - Cable HDMI 2m [Apple, Samsung] (iPhone 14, Galaxy S24)' })
    name!: string;

    @ApiProperty({ example: 12.50, description: 'Precio actual de venta — referencia para PVP sugerido' })
    precio_actual!: number;
}
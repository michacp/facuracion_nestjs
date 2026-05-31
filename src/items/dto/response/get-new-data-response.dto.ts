import { ApiProperty } from '@nestjs/swagger';

class BrandItemDto {
    @ApiProperty({ description: 'ID de la marca', example: 1 })
    id!: number;

    @ApiProperty({ description: 'Nombre de la marca', example: 'Apple' })
    name!: string;
}

class TaxItemDto {
    @ApiProperty({ description: 'ID del tipo de impuesto', example: 2 })
    id!: number;

    @ApiProperty({ description: 'Nombre del impuesto', example: 'IVA' })
    name!: string;
}

class TypeItemDto {
    @ApiProperty({ description: 'ID del tipo de ítem', example: 1 })
    id!: number;

    @ApiProperty({ description: 'Nombre del tipo de ítem', example: 'PRODUCTO' })
    name!: string;
}

export class GetNewDataResponseDto {
    @ApiProperty({ type: [BrandItemDto], description: 'Listado de marcas disponibles' })
    brands!: BrandItemDto[];

    @ApiProperty({ type: [TaxItemDto], description: 'Listado de tipos de impuestos (SRI)' })
    taxes!: TaxItemDto[];

    @ApiProperty({ type: [TypeItemDto], description: 'Clasificaciones del ítem (Producto/Servicio)' })
    type!: TypeItemDto[];
}
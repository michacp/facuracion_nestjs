import { ApiProperty } from '@nestjs/swagger';

// Genérico id(number)+name — reutilizado en voucherType y payType
export class IdNameDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'EFECTIVO' })
    name!: string;
}

export class TaxItemDto {
    @ApiProperty({ example: 2 })
    id!: number;

    @ApiProperty({ example: 'IVA - IVA 15%' })
    name!: string;

    @ApiProperty({ example: 15.00 })
    percentage!: number;
}
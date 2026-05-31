import { ApiProperty } from '@nestjs/swagger';

// Estructura estándar { id, name } para selectores
export class FindProveedorResponseDto {
    @ApiProperty({ example: 5 })
    id!: number;

    @ApiProperty({ example: '0912345678001 - PROVEEDOR S.A.' })
    name!: string;
}
import { ApiProperty } from '@nestjs/swagger';

export class SaveProveedorResponseDto {
    @ApiProperty({ example: 5, description: 'ID del proveedor' })
    id!: number;

    @ApiProperty({ example: '0912345678001 - PROVEEDOR S.A.', description: 'Label para selectores' })
    name!: string;
}
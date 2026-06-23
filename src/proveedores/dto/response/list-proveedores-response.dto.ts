import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProveedorListItemDto {
    @ApiProperty({ example: 5 })
    proveedor_id!: number;

    @ApiProperty({ example: '0912345678001' })
    identificacion!: string;

    @ApiProperty({ example: 'CÉDULA' })
    tipo_identificacion_nombre!: string;

    @ApiProperty({ example: 'PROVEEDOR S.A.' })
    razon_social!: string;

    @ApiPropertyOptional({ example: 'PROV S.A.', nullable: true })
    nombre_comercial!: string | null;

    @ApiProperty({ example: 'Ecuador' })
    pais!: string;

    @ApiPropertyOptional({ example: 'proveedor@mail.com', nullable: true })
    email!: string | null;

    @ApiPropertyOptional({ example: '0991234567', nullable: true })
    telefono!: string | null;

    @ApiProperty({ example: 3, description: 'Cantidad de compras registradas' })
    total_compras!: number;
}

export class ListProveedoresResponseDto {
    @ApiProperty({ example: 50 })
    total!: number;

    @ApiProperty({ type: [ProveedorListItemDto] })
    proveedores!: ProveedorListItemDto[];
}
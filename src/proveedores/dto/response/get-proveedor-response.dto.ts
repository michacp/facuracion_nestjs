import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetProveedorResponseDto {
    @ApiProperty({ example: 5 })
    proveedor_id!: number;

    @ApiProperty({ example: '0912345678001' })
    identificacion!: string;

    @ApiProperty({ example: '04', description: 'Código SRI — para preseleccionar el select' })
    tipo_identificacion!: string;

    @ApiProperty({ example: 'RUC', description: 'Nombre legible' })
    tipo_identificacion_nombre!: string;

    @ApiProperty({ example: 'PROVEEDOR S.A.' })
    razon_social!: string;

    @ApiPropertyOptional({ example: 'PROV S.A.', nullable: true })
    nombre_comercial!: string | null;

    @ApiProperty({ example: 1, description: 'ID del país — para preseleccionar el select' })
    pais_id!: number;

    @ApiProperty({ example: 'Ecuador' })
    pais_nombre!: string;

    @ApiPropertyOptional({ example: 'Av. Principal 123', nullable: true })
    direccion!: string | null;

    @ApiPropertyOptional({ example: '0991234567', nullable: true })
    telefono!: string | null;

    @ApiPropertyOptional({ example: 'proveedor@mail.com', nullable: true })
    email!: string | null;
}
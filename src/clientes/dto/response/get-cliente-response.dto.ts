import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CampoAdicionalDto {
    @ApiProperty({ example: 'Lugar de entrega' })
    clave!: string;

    @ApiProperty({ example: 'Bodega Norte, calle 5' })
    valor!: string;
}

export class GetClienteResponseDto {
    @ApiProperty({ example: 15 })
    id!: number;

    @ApiProperty({ example: '0912345678' })
    identificacion!: string;

    @ApiProperty({ example: '05', description: 'Código SRI — para preseleccionar el select' })
    tipo_identificacion!: string;

    @ApiProperty({ example: 'CÉDULA', description: 'Nombre legible del tipo de identificación' })
    tipo_identificacion_nombre!: string;

    @ApiProperty({ example: 'ORELLANA ANDRADE ANDRÉS PATRICIO' })
    razon_social!: string;

    @ApiPropertyOptional({ example: 'Av. Principal 123', nullable: true })
    direccion!: string | null;

    @ApiPropertyOptional({ example: 'andres@mail.com', nullable: true })
    email!: string | null;

    @ApiPropertyOptional({ example: '0991234567', nullable: true })
    telefono!: string | null;

    @ApiProperty({ example: false })
    es_consumidor_final!: boolean;

    @ApiProperty({ type: [CampoAdicionalDto] })
    camposAdicionales!: CampoAdicionalDto[];
}
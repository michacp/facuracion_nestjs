import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClienteListItemDto {
    @ApiProperty({ example: 15 })
    id!: number;

    @ApiProperty({ example: 'ORELLANA ANDRADE ANDRÉS PATRICIO' })
    razon_social!: string;

    @ApiProperty({ example: '0912345678' })
    identificacion!: string;

    @ApiProperty({ example: 'CÉDULA' })
    tipo_identificacion!: string;

    @ApiPropertyOptional({ example: 'andres@mail.com', nullable: true })
    email!: string | null;

    @ApiPropertyOptional({ example: '0991234567', nullable: true })
    telefono!: string | null;

    @ApiPropertyOptional({ example: 'Av. Principal 123', nullable: true })
    direccion!: string | null;
}

export class ListClientesResponseDto {
    @ApiProperty({ example: 250 })
    total!: number;

    @ApiProperty({ type: [ClienteListItemDto] })
    clientes!: ClienteListItemDto[];
}
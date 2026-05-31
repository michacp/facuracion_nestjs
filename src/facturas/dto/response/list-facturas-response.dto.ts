import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FacturaListItemDto {
    @ApiProperty({ example: 5 })
    factura_id!: number;

    @ApiProperty({ example: 42 })
    venta_id!: number;

    @ApiProperty({ example: 'FAC-0000001' })
    numero_venta!: string;

    @ApiProperty({ example: 'JUAN PÉREZ' })
    cliente!: string;

    @ApiProperty({ example: '0912345678' })
    identificacion!: string;

    @ApiProperty({ example: '2024-06-01T00:00:00.000Z' })
    fecha_emision!: Date;

    @ApiProperty({ example: 115.00 })
    total!: number;

    @ApiProperty({ example: 'AUTORIZADO' })
    estado!: string;

    @ApiPropertyOptional({ nullable: true })
    fecha_autorizacion!: Date | null;

    @ApiPropertyOptional({ nullable: true })
    fecha_envio_sri!: Date | null;

    @ApiProperty({ example: 2 })
    ambiente!: number;

    @ApiProperty({ example: '270520260119...' })
    clave_acceso!: string;

    @ApiProperty({ example: true })
    tiene_xml!: boolean;

    @ApiPropertyOptional({ nullable: true })
    mensaje_sri!: string | null;
}

export class EstadoSriItemDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'AUTORIZADO' })
    name!: string;
}

export class ListFacturasResponseDto {
    @ApiProperty({ example: 100 })
    total!: number;

    @ApiProperty({ type: [FacturaListItemDto] })
    facturas!: FacturaListItemDto[];

    @ApiProperty({ type: [EstadoSriItemDto] })
    estados!: EstadoSriItemDto[]; // ← igual que categories en productos
}
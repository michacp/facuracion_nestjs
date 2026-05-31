import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncFacturaResponseDto {
    @ApiProperty({ example: 5 })
    factura_id!: number;

    @ApiProperty({ example: 'AUTORIZADO' })
    estadoAnterior!: string;

    @ApiProperty({ example: 'ANULADO' })
    estadoNuevo!: string;

    @ApiProperty({ example: true, description: 'El estado cambió respecto al anterior' })
    cambio!: boolean;

    @ApiPropertyOptional({ example: 'Comprobante anulado por el contribuyente', nullable: true })
    mensajeSRI!: string | null;

    @ApiPropertyOptional({ example: '2024-06-01T00:05:00.000Z', nullable: true })
    fechaAutorizacion!: string | null;

    @ApiProperty({ example: true, description: 'XML actualizado en Drive' })
    xmlActualizado!: boolean;
}
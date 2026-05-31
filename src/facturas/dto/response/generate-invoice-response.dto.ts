import { ApiProperty } from '@nestjs/swagger';

export class GenerateInvoiceResponseDto {
    @ApiProperty({ example: 'FAC-0000001' })
    claveAcceso!: string;

    @ApiProperty({ example: 'AUTORIZADO', enum: ['AUTORIZADO', 'NO AUTORIZADO', 'DEVUELTA', 'PENDIENTE'] })
    estado!: string;

    @ApiProperty({ example: 'Comprobante autorizado correctamente' })
    mensajeSRI!: string;

    @ApiProperty({ example: '2024-06-01T00:00:00.000Z', nullable: true })
    fechaAutorizacion!: string | null;
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RetryFacturaResponseDto {
    @ApiProperty({ example: 'AUTORIZADO' })
    estado!: string;

    @ApiProperty({ example: '280520260119...' })
    claveAcceso!: string;

    @ApiPropertyOptional({ nullable: true })
    mensajeSRI!: string | null;

    @ApiPropertyOptional({ nullable: true })
    fechaAutorizacion!: string | null;

    @ApiProperty({
        example: false,
        description: 'true = mismo día (XML original). false = día diferente (factura recreada con fecha hoy)',
    })
    xml_original_usado!: boolean;

    @ApiProperty({
        example: 'Factura recreada con fecha 28/05/2026 — mismo número de secuencial',
        description: 'Descripción de lo que ocurrió',
    })
    descripcion?: string;
}
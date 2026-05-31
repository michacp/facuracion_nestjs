import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompraResponseDto {
    @ApiProperty({ example: true })
    success!: boolean;

    @ApiProperty({ example: 'numero_documento' })
    campo!: string;

    @ApiProperty({ example: '001-001-000000999' })
    valorNuevo!: any;
}

export class AddItemCompraResponseDto {
    @ApiProperty({ example: 5, description: 'ID del nuevo detalle' })
    detalle_id!: number;

    @ApiProperty({ example: 7, description: 'ID del lote creado' })
    lote_id!: number;

    @ApiProperty({ example: 'C000003-42' })
    numero_lote!: string;
}

export class RemoveItemCompraResponseDto {
    @ApiProperty({ example: true })
    success!: boolean;

    @ApiProperty({ example: 'Ítem eliminado y stock revertido' })
    mensaje!: string;

    @ApiProperty({ example: true, description: 'Si el lote fue eliminado' })
    lote_eliminado!: boolean;
}
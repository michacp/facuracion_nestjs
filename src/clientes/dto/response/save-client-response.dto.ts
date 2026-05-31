import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CampoAdicionalResponseDto {
    @ApiProperty({ example: 'lugar_entrega' })
    clave!: string;

    @ApiProperty({ example: 'Bodega Central' })
    valor!: string;
}

export class SaveClientResponseDto {
    @ApiProperty({ example: 15 })
    id!: number;

    @ApiProperty({ example: '0912345678 - JUAN PÉREZ' })
    name!: string;

    @ApiPropertyOptional({ type: [CampoAdicionalResponseDto] })
    camposAdicionales?: CampoAdicionalResponseDto[];
}
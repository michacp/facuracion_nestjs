import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt, IsPositive, IsString, IsNotEmpty, IsOptional, IsIn,
} from 'class-validator';

// Campos editables permitidos — whitelist explícita
export type CampoEditable =
    | 'numero_documento'
    | 'fecha_emision'
    | 'observaciones'
    | 'tipo_doc_id'
    | 'estado_pago_id'
    | 'proveedor_id'
    | 'descuento_global'
    | 'gastos_envio';

export class UpdateCompraFieldBodyDto {
    @ApiProperty({ example: 3 })
    @IsInt()
    @IsPositive()
    compra_id!: number;

    @ApiProperty({
        example: 'numero_documento',
        enum: [
            'numero_documento', 'fecha_emision', 'observaciones',
            'tipo_doc_id', 'estado_pago_id', 'proveedor_id',
            'descuento_global', 'gastos_envio',
        ],
    })
    @IsString()
    @IsIn([
        'numero_documento', 'fecha_emision', 'observaciones',
        'tipo_doc_id', 'estado_pago_id', 'proveedor_id',
        'descuento_global', 'gastos_envio',
    ])
    campo!: CampoEditable;

    @ApiProperty({ example: '001-001-000000999' })
    @IsNotEmpty()
    valor!: any;
}
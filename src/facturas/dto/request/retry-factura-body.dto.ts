import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class RetryFacturaBodyDto {
    @ApiProperty({ example: 5, description: 'ID de la factura a reenviar' })
    @IsInt()
    @IsPositive()
    factura_id!: number;
}
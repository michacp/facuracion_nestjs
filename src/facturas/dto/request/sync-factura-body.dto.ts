import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class SyncFacturaBodyDto {
    @ApiProperty({ description: 'ID de la factura a sincronizar con el SRI', example: 5 })
    @IsInt()
    @IsPositive()
    factura_id!: number;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class PrintSaleBodyDto {
    @ApiProperty({ description: 'ID de la venta a imprimir', example: 42 })
    @IsInt()
    @IsPositive()
    id!: number;
}
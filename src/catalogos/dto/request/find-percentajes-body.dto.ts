import { IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPercentajesBodyDto {
    @ApiProperty({
        description: 'ID del tipo de impuesto para filtrar sus tarifas',
        example: 1,
    })
    @IsInt()
    @IsPositive()
    id!: number;
}
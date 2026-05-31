import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class FindOneItemBodyDto {
    @ApiProperty({ description: 'ID del ítem a buscar', example: 42 })
    @IsInt()
    @IsPositive()
    id!: number;
}
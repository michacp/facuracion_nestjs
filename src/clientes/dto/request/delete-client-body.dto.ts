import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class DeleteClientBodyDto {
    @ApiProperty({ description: 'ID del cliente a eliminar (soft delete)', example: 15 })
    @IsInt()
    @IsPositive()
    id!: number;
}
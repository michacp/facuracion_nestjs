import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class GetClienteBodyDto {
    @ApiProperty({ example: 15 })
    @IsInt()
    @IsPositive()
    id!: number;
}
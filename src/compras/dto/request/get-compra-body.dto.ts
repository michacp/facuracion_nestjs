import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class GetCompraBodyDto {
    @ApiProperty({ example: 3 })
    @IsInt()
    @IsPositive()
    compra_id!: number;
}
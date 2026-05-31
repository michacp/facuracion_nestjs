import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class RemoveItemCompraBodyDto {
    @ApiProperty({ example: 3 })
    @IsInt()
    @IsPositive()
    compra_id!: number;

    @ApiProperty({ example: 1, description: 'ID del detalle a eliminar' })
    @IsInt()
    @IsPositive()
    detalle_id!: number;
}
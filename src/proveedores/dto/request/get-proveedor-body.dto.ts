import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class GetProveedorBodyDto {
    @ApiProperty({ example: 5 })
    @IsInt()
    @IsPositive()
    proveedor_id!: number;
}
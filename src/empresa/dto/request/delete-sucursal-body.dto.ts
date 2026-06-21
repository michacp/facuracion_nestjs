import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class DeleteSucursalBodyDto {
    @ApiProperty({ example: 2, description: 'ID de la sucursal a eliminar' })
    @IsInt()
    @IsPositive()
    sucursales_id!: number;
}
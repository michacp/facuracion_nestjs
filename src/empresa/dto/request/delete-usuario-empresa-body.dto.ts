import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class DeleteUsuarioEmpresaBodyDto {
    @ApiProperty({ example: 3, description: 'ID del vínculo usuario-empresa a eliminar' })
    @IsInt()
    @IsPositive()
    usuario_empresa_id!: number;
}
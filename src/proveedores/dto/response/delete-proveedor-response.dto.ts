import { ApiProperty } from '@nestjs/swagger';

export class DeleteProveedorResponseDto {
    @ApiProperty({ example: true })
    success!: boolean;

    @ApiProperty({
        example: 'Proveedor desactivado (tiene compras registradas)',
        description: 'Indica si fue soft delete o eliminación permanente',
    })
    mensaje!: string;

    @ApiProperty({ example: true, description: 'true = soft delete, false = eliminado permanentemente' })
    soft_delete!: boolean;
}
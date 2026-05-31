import { ApiProperty } from '@nestjs/swagger';

export class TipoIdentificacionDto {
    @ApiProperty({ example: '04' })
    id!: string;

    @ApiProperty({ example: 'RUC' })
    name!: string;
}
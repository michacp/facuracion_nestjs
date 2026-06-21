// src/common/dto/select-option.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class SelectOptionDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'Administrador' })
    name!: string;
}
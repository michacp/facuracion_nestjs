import { ApiProperty } from '@nestjs/swagger';

export class FindClientResponseDto {
    @ApiProperty({ example: 15 })
    id!: number;

    @ApiProperty({ example: '0912345678 - JUAN PÉREZ' })
    name!: string;
}
import { ApiProperty } from '@nestjs/swagger';

export class ModelItemDto {
    @ApiProperty({ example: 12 })
    id!: number;

    @ApiProperty({ example: 'iPhone 14 Pro' })
    name!: string;
} 
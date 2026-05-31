import { IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindModelsBodyDto {
    @ApiProperty({
        description: 'ID de la marca para filtrar sus modelos',
        example: 3,
    })
    @IsInt()
    @IsPositive()
    id!: number;
}
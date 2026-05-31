import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class FindClientBodyDto {
    @ApiProperty({
        description: 'Término de búsqueda: identificación, razón social o combinación',
        example: '0912345678',
    })
    @IsString()
    @IsNotEmpty()
    search!: string;
}
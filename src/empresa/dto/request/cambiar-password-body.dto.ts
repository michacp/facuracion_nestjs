import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CambiarPasswordBodyDto {
    @ApiProperty({ example: 'miPasswordActual123' })
    @IsString()
    @IsNotEmpty()
    passwordActual!: string;

    @ApiProperty({ example: 'miPasswordNuevo456' })
    @IsString()
    @MinLength(6)
    passwordNuevo!: string;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SaveFirmaBodyDto {
    @ApiProperty({
        description: 'Contraseña del archivo .p12',
        example: 'miPassword123',
    })
    @IsString()
    @IsNotEmpty()
    password!: string;
}
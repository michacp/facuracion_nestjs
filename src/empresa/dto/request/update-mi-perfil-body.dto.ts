import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMiPerfilBodyDto {
    @ApiPropertyOptional({ example: 'Juan Pérez' })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    nombre?: string;

    @ApiPropertyOptional({ example: 'nuevo@email.com' })
    @IsEmail()
    @IsOptional()
    @MaxLength(100)
    email?: string;

    // username NO es editable — se usa para login y queda fijo
}
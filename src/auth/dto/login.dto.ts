// login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'juan.perez',
        description: 'Nombre de usuario o correo electrónico'
    })
    @IsString()
    @IsNotEmpty({ message: 'El usuario o email es requerido' })
    usernameOrEmail!: string;

    @ApiProperty({
        example: '123456',
        description: 'Contraseña del usuario (mínimo 6 caracteres)',
        minLength: 6
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password!: string;

    @ApiProperty({
        example: false,
        description: 'Recordar sesión por 7 días',
        required: false,
        default: false
    })
    @IsBoolean()
    @IsOptional()
    rememberMe?: boolean;
}
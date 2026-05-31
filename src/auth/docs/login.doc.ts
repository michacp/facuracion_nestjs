import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';

export function ApiAuthLogin() {
    return applyDecorators(
        ApiOperation({ summary: 'Iniciar sesión' }),

        ApiBody({ type: LoginDto }),                    // ← Agregar esto

        ApiResponse({
            status: 200,
            description: 'Login exitoso',
            type: AuthResponseDto
        }),
        ApiResponse({
            status: 401,
            description: 'Credenciales inválidas'
        }),
        ApiResponse({
            status: 403,
            description: 'Acceso denegado (usuario/empresa inactiva)'
        })
    );
}
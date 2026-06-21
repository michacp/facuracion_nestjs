import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { MiPerfilResponseDto } from '../dto/response/mi-perfil-response.dto';

export const GetMiPerfilDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Obtener mis datos de perfil',
            description: 'Devuelve los datos del usuario autenticado en la empresa actual del JWT.',
        }),
        ApiOkResponse({ type: MiPerfilResponseDto }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
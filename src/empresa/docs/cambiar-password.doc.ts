import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiBadRequestResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CambiarPasswordBodyDto } from '../dto/request/cambiar-password-body.dto';

export const CambiarPasswordDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Cambiar mi contraseña',
            description:
                'Requiere la contraseña actual para validar la identidad antes de cambiarla. ' +
                'Mínimo 6 caracteres para la nueva contraseña.',
        }),
        ApiBody({ type: CambiarPasswordBodyDto }),
        ApiOkResponse({ description: 'Contraseña actualizada correctamente' }),
        ApiBadRequestResponse({ description: 'La contraseña actual no coincide' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
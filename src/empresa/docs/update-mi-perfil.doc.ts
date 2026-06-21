import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiConflictResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UpdateMiPerfilBodyDto } from '../dto/request/update-mi-perfil-body.dto';

export const UpdateMiPerfilDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Actualizar mis datos personales',
            description:
                'Permite al usuario autenticado editar su propio nombre y email. ' +
                'El username no es editable. Solo enviar los campos que cambian.',
        }),
        ApiBody({ type: UpdateMiPerfilBodyDto }),
        ApiOkResponse({ description: 'Datos actualizados correctamente' }),
        ApiConflictResponse({ description: 'El email ya está en uso por otro usuario' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
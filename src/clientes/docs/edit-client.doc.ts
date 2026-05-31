import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiBadRequestResponse, ApiNotFoundResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EditClientBodyDto } from '../dto/request/edit-client-body.dto';

export const EditClientDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Editar cliente',
            description:
                'Actualiza datos del cliente y sincroniza sus campos adicionales. ' +
                'Valida que pertenezca a la empresa del JWT (multi-tenant). ' +
                'No permite editar identificación ni tipo.',
        }),
        ApiBody({ type: EditClientBodyDto }),
        ApiOkResponse({ description: 'Cliente actualizado correctamente' }),
        ApiBadRequestResponse({ description: 'Datos inválidos' }),
        ApiNotFoundResponse({ description: 'Cliente no encontrado o eliminado' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
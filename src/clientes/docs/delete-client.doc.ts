import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiNotFoundResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DeleteClientBodyDto } from '../dto/request/delete-client-body.dto';

export const DeleteClientDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Eliminar cliente (soft delete)',
            description:
                'Marca el cliente como eliminado con deleted_at. ' +
                'No borra el registro físicamente para preservar historial de ventas. ' +
                'Valida que pertenezca a la empresa del JWT (multi-tenant).',
        }),
        ApiBody({ type: DeleteClientBodyDto }),
        ApiOkResponse({ description: 'Cliente eliminado correctamente' }),
        ApiNotFoundResponse({ description: 'Cliente no encontrado' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiNotFoundResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DeleteProveedorBodyDto } from '../dto/request/delete-proveedor-body.dto';
import { DeleteProveedorResponseDto } from '../dto/response/delete-proveedor-response.dto';

export const DeleteProveedorDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Eliminar proveedor',
            description:
                'Si el proveedor tiene compras registradas, se hace soft delete (deleted_at). ' +
                'Si no tiene ningún registro asociado, se elimina permanentemente.',
        }),
        ApiBody({ type: DeleteProveedorBodyDto }),
        ApiOkResponse({ type: DeleteProveedorResponseDto }),
        ApiNotFoundResponse({ description: 'Proveedor no encontrado' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
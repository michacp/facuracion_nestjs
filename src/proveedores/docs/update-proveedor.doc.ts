import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiConflictResponse, ApiNotFoundResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UpdateProveedorBodyDto } from '../dto/request/update-proveedor-body.dto';
import { SaveProveedorResponseDto } from '../dto/response/save-proveedor-response.dto';

export const UpdateProveedorDoc = () =>
    applyDecorators(
        ApiOperation({ summary: 'Editar un proveedor existente' }),
        ApiBody({ type: UpdateProveedorBodyDto }),
        ApiOkResponse({ type: SaveProveedorResponseDto }),
        ApiConflictResponse({ description: 'Identificación duplicada con otro proveedor' }),
        ApiNotFoundResponse({ description: 'Proveedor no encontrado' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
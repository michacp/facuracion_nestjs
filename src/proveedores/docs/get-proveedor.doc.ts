import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiNotFoundResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetProveedorBodyDto } from '../dto/request/get-proveedor-body.dto';
import { GetProveedorResponseDto } from '../dto/response/get-proveedor-response.dto';

export const GetProveedorDoc = () =>
    applyDecorators(
        ApiOperation({ summary: 'Obtener datos de un proveedor para editar' }),
        ApiBody({ type: GetProveedorBodyDto }),
        ApiOkResponse({ type: GetProveedorResponseDto }),
        ApiNotFoundResponse({ description: 'Proveedor no encontrado' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
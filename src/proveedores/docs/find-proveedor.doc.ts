import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FindProveedorBodyDto } from '../dto/request/find-proveedor-body.dto';
import { FindProveedorResponseDto } from '../dto/response/find-proveedor-response.dto';

export const FindProveedorDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Buscar proveedores para selectores',
            description:
                'Busca por identificación, razón social o nombre comercial. ' +
                'Filtrado por empresa del JWT (multi-tenant). ' +
                'Retorna array de { id, name } para autocompletado.',
        }),
        ApiBody({ type: FindProveedorBodyDto }),
        ApiOkResponse({ type: [FindProveedorResponseDto] }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
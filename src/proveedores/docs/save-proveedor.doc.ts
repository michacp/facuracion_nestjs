import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiBadRequestResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SaveProveedorBodyDto } from '../dto/request/save-proveedor-body.dto';
import { SaveProveedorResponseDto } from '../dto/response/save-proveedor-response.dto';

export const SaveProveedorDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Crear nuevo proveedor',
            description:
                'Registra un proveedor asociado a la empresa del JWT (multi-tenant). ' +
                'Retorna { id, name } estándar para usar directamente en selectores.',
        }),
        ApiBody({ type: SaveProveedorBodyDto }),
        ApiOkResponse({ type: SaveProveedorResponseDto }),
        ApiBadRequestResponse({ description: 'Datos inválidos o identificación duplicada' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
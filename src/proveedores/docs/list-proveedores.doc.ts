import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ListProveedoresBodyDto } from '../dto/request/list-proveedores-body.dto';
import { ListProveedoresResponseDto } from '../dto/response/list-proveedores-response.dto';

export const ListProveedoresDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Listar proveedores paginados',
            description:
                'Devuelve proveedores de la empresa del JWT con búsqueda libre (AND de palabras) ' +
                'por razón social, nombre comercial o identificación. Incluye cantidad de compras por proveedor.',
        }),
        ApiBody({ type: ListProveedoresBodyDto }),
        ApiOkResponse({ type: ListProveedoresResponseDto }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
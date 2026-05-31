import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FindProductsIdNameBodyDto } from '../dto/request/find-products-idname-body.dto';
import { FindProductsIdNameResponseDto } from '../dto/response/find-products-idname-response.dto';

export const FindProductsIdNameDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Buscar ítems/lotes para selectores de venta',
            description:
                'Retorna lotes con label enriquecido (código, lote, nombre, modelos, stock, precio). ' +
                'Sin búsqueda → últimos 50 lotes. ' +
                'Búsqueda numérica → filtra por código auxiliar (con padding a 6 dígitos). ' +
                'Búsqueda texto → filtra por nombre, modelo o marca. ' +
                'Filtrado por empresa del JWT (multi-tenant). ' +
                'Migrado desde POST /products/findproductsidname (Express legacy).',
        }),
        ApiBody({ type: FindProductsIdNameBodyDto }),
        ApiOkResponse({
            description: 'Lista de lotes formateados para selectores',
            type: [FindProductsIdNameResponseDto],
        }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ListItemsBodyDto } from '../dto/request/list-items-body.dto';
import { ListItemsResponseDto } from '../dto/response/list-items-response.dto';

export const ListItemsDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Listar ítems paginados con filtros',
            description:
                'Devuelve ítems de la empresa autenticada con paginación, búsqueda y filtro por categoría. ' +
                'La búsqueda numérica filtra por código auxiliar; la textual por nombre, marca o modelo. ' +
                'Incluye categorías disponibles para el selector del frontend. ' +
                'Migrado desde POST /products/list (Express legacy).',
        }),
        ApiBody({ type: ListItemsBodyDto }),
        ApiOkResponse({
            description: 'Ítems paginados + categorías',
            type: ListItemsResponseDto,
        }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
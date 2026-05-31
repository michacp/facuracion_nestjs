import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiOkResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Last5SavesItemDto } from '../dto/response/last5-saves-response.dto';

export const Last5SavesDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Últimos 5 ítems creados',
            description:
                'Devuelve los últimos 5 ítems registrados de la empresa del usuario autenticado, ' +
                'incluyendo stock total, tipo, impuesto y modelos/marcas asociados. ' +
                'Migrado desde GET /products/last5saves (Express legacy).',
        }),
        ApiOkResponse({
            description: 'Lista de los últimos 5 ítems',
            type: [Last5SavesItemDto],
        }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
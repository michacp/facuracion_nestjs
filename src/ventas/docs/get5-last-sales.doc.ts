import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiOkResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Get5LastSalesResponseDto } from '../dto/response/get5-last-sales-response.dto';

export const Get5LastSalesDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Últimas 5 ventas con detalle',
            description:
                'Devuelve las últimas 5 ventas de la empresa del JWT con sus ítems. ' +
                'Soporta productos (lote_id) y servicios (item_id directo). ' +
                'Migrado desde GET /sales/get5lastsales (Express legacy).',
        }),
        ApiOkResponse({
            description: 'Últimas 5 ventas con sus detalles',
            type: [Get5LastSalesResponseDto],
        }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
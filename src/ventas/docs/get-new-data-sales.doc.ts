import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiOkResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetNewDataSalesResponseDto } from '../dto/response/get-new-data-sales-response.dto';

export const GetNewDataSalesDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Datos iniciales para formulario de ventas',
            description:
                'Devuelve en paralelo: productos/lotes disponibles (últimos 50), ' +
                'tarifas de impuesto, tipos de comprobante y formas de pago. ' +
                'Productos filtrados por empresa del JWT (multi-tenant). ' +
                'Migrado desde GET /sales/getnewdata (Express legacy).',
        }),
        ApiOkResponse({
            description: 'Datos iniciales del formulario de ventas',
            type: GetNewDataSalesResponseDto,
        }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
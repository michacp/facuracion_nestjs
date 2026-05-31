import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ListSalesBodyDto } from '../dto/request/list-sales-body.dto';
import { ListSalesResponseDto } from '../dto/response/list-sales-response.dto';

export const ListSalesDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Listar ventas paginadas con filtros',
            description:
                'Devuelve ventas de la empresa del JWT con paginación y filtros opcionales. ' +
                'Soporta búsqueda por número de venta o cliente, y rango de fechas. ' +
                'Incluye ítems del detalle resolviendo productos (lote) y servicios (item directo). ' +
                'Migrado desde POST /sales/list (Express legacy) — agrega paginación y multi-tenant.',
        }),
        ApiBody({ type: ListSalesBodyDto }),
        ApiOkResponse({
            description: 'Ventas paginadas con detalle de ítems',
            type: ListSalesResponseDto,
        }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
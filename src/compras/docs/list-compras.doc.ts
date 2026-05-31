import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ListComprasBodyDto } from '../dto/request/list-compras-body.dto';
import { ListComprasResponseDto } from '../dto/response/list-compras-response.dto';

export const ListComprasDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Listar ingresos de mercadería paginados',
            description:
                'Devuelve compras de la empresa del JWT con filtros opcionales. ' +
                'Incluye catálogo de estados de pago para el selector de filtro.',
        }),
        ApiBody({ type: ListComprasBodyDto }),
        ApiOkResponse({ type: ListComprasResponseDto }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
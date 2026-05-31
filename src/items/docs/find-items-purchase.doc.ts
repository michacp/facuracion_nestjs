import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FindItemsPurchaseBodyDto } from '../dto/request/find-items-purchase-body.dto';
import { FindItemsPurchaseResponseDto } from '../dto/response/find-items-purchase-response.dto';

export const FindItemsPurchaseDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Buscar ítems para formulario de compra',
            description:
                'Devuelve ítems de la empresa sin información de lotes. ' +
                'Label enriquecido con código, nombre, marcas y modelos. ' +
                'Sin búsqueda retorna los últimos 50. ' +
                'Multi-tenant por empresa del JWT.',
        }),
        ApiBody({ type: FindItemsPurchaseBodyDto }),
        ApiOkResponse({ type: [FindItemsPurchaseResponseDto] }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
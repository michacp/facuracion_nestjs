import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiBadRequestResponse, ApiNotFoundResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RemoveItemCompraBodyDto } from '../dto/request/remove-item-compra-body.dto';
import { RemoveItemCompraResponseDto } from '../dto/response/update-compra-response.dto';

export const RemoveItemCompraDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Quitar ítem de una compra existente',
            description:
                'Elimina el detalle y revierte el stock del lote SI el lote no tiene ventas asociadas. ' +
                'Si el lote tiene ventas → bloquea la operación con 400.',
        }),
        ApiBody({ type: RemoveItemCompraBodyDto }),
        ApiOkResponse({ type: RemoveItemCompraResponseDto }),
        ApiBadRequestResponse({ description: 'El lote tiene ventas asociadas — no se puede eliminar' }),
        ApiNotFoundResponse({ description: 'Detalle no encontrado' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
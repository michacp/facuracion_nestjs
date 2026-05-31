import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiNotFoundResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AddItemCompraBodyDto } from '../dto/request/add-item-compra-body.dto';
import { AddItemCompraResponseDto } from '../dto/response/update-compra-response.dto';

export const AddItemCompraDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Agregar ítem a una compra existente',
            description:
                'Crea un nuevo detalle, genera el lote de stock y recalcula totales. ' +
                'Si aplicar_pvp=true actualiza el precio de venta del ítem.',
        }),
        ApiBody({ type: AddItemCompraBodyDto }),
        ApiOkResponse({ type: AddItemCompraResponseDto }),
        ApiNotFoundResponse({ description: 'Compra o ítem no encontrado' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
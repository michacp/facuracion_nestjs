import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse,
} from '@nestjs/swagger';
import { SaveCompraBodyDto } from '../dto/request/save-compra-body.dto';
import { SaveCompraResponseDto } from '../dto/response/save-compra-response.dto';

export const SaveCompraDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Registrar ingreso de mercadería',
            description:
                'Crea la compra, genera un lote por cada ítem y actualiza el stock. ' +
                'Si aplicar_pvp=true en el detalle, actualiza item_precio_unitario. ' +
                'El estado de pago inicial es PENDIENTE. ' +
                'Multi-tenant: proveedor e ítems deben pertenecer a la empresa del JWT.',
        }),
        ApiBody({ type: SaveCompraBodyDto }),
        ApiOkResponse({ type: SaveCompraResponseDto }),
        ApiBadRequestResponse({ description: 'Sin detalles o datos inválidos' }),
        ApiNotFoundResponse({ description: 'Proveedor o ítem no encontrado' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
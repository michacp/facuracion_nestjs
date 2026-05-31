import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiNotFoundResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UpdateCompraFieldBodyDto } from '../dto/request/update-compra-field-body.dto';
import { UpdateCompraResponseDto } from '../dto/response/update-compra-response.dto';

export const UpdateCompraFieldDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Editar campo específico de una compra',
            description:
                'Actualiza un campo individual de la compra (texto, select, fecha). ' +
                'Recalcula totales automáticamente si se edita descuento_global o gastos_envio. ' +
                'Multi-tenant: solo compras de la empresa del JWT.',
        }),
        ApiBody({ type: UpdateCompraFieldBodyDto }),
        ApiOkResponse({ type: UpdateCompraResponseDto }),
        ApiNotFoundResponse({ description: 'Compra no encontrada' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
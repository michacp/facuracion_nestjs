import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiNotFoundResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetCompraBodyDto } from '../dto/request/get-compra-body.dto';
import { GetCompraResponseDto } from '../dto/response/get-compra-response.dto';

export const GetCompraDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Obtener detalle de un ingreso',
            description:
                'Devuelve todos los datos de la compra con sus detalles, ' +
                'datos del proveedor, financiero y estado de pago. ' +
                'Multi-tenant: solo compras de la empresa del JWT.',
        }),
        ApiBody({ type: GetCompraBodyDto }),
        ApiOkResponse({ type: GetCompraResponseDto }),
        ApiNotFoundResponse({ description: 'Compra no encontrada' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
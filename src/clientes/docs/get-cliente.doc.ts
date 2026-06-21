import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiNotFoundResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetClienteBodyDto } from '../dto/request/get-cliente-body.dto';
import { GetClienteResponseDto } from '../dto/response/get-cliente-response.dto';

export const GetClienteDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Obtener datos de un cliente para editar',
            description:
                'Devuelve todos los campos editables del cliente, incluyendo ' +
                'sus campos adicionales personalizados. Multi-tenant por empresa del JWT.',
        }),
        ApiBody({ type: GetClienteBodyDto }),
        ApiOkResponse({ type: GetClienteResponseDto }),
        ApiNotFoundResponse({ description: 'Cliente no encontrado' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
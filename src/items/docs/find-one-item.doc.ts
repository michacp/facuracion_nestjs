import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FindOneItemBodyDto } from '../dto/request/find-one-item-body.dto';
import { FindOneItemResponseDto } from '../dto/response/find-one-item-response.dto';

export const FindOneItemDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Obtener un ítem por ID',
            description:
                'Devuelve el detalle completo de un ítem: tarifa de impuesto, ' +
                'modelos compatibles y lotes de stock. ' +
                'Valida que el ítem pertenezca a la empresa del JWT (multi-tenant). ' +
                'Migrado desde POST /products/findoneproduct (Express legacy).',
        }),
        ApiBody({ type: FindOneItemBodyDto }),
        ApiOkResponse({
            description: 'Detalle completo del ítem',
            type: FindOneItemResponseDto,
        }),
        ApiNotFoundResponse({ description: 'Ítem no encontrado o no pertenece a la empresa' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
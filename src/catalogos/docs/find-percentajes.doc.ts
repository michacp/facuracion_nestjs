import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiBadRequestResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FindPercentajesBodyDto } from '../dto/request/find-percentajes-body.dto';
import { TarifaItemDto } from '../dto/response/find-percentajes-response.dto';

export const FindPercentajesDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Obtener tarifas de impuesto por tipo',
            description:
                'Devuelve todas las tarifas asociadas a un tipo de impuesto específico. ' +
                'Migrado desde POST /products/findpercentajes (Express legacy).',
        }),
        ApiBody({ type: FindPercentajesBodyDto }),
        ApiOkResponse({
            description: 'Lista de tarifas del tipo de impuesto solicitado',
            type: [TarifaItemDto], // ← array directamente
        }),
        ApiBadRequestResponse({ description: 'El campo id es inválido o falta' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
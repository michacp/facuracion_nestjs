import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiBadRequestResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FindModelsBodyDto } from '../dto/request/find-models-body.dto';
import { ModelItemDto } from '../dto/response/find-models-response.dto';

export const FindModelsDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Obtener modelos por marca',
            description:
                'Devuelve todos los modelos asociados a una marca específica. ' +
                'Migrado desde POST /products/findmodels (Express legacy).',
        }),
        ApiBody({ type: FindModelsBodyDto }),
        ApiOkResponse({
            description: 'Lista de modelos de la marca solicitada',
            type: ModelItemDto, // <-- Usamos el DTO del ítem
            isArray: true,      // <-- CLAVE: Esto le dice a Swagger que la respuesta es un array plano [ {...}, {...} ]
        }),
        ApiBadRequestResponse({ description: 'El campo id es inválido o falta' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
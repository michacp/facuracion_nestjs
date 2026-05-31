import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiOkResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TipoIdentificacionDto } from '../dto/response/get-new-data-client-response.dto';

export const GetNewDataClientDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Obtener tipos de identificación SRI',
            description:
                'Devuelve el catálogo de tipos de identificación del SRI. ' +
                'Migrado desde GET /clients/getnewdata (Express legacy).',
        }),
        ApiOkResponse({
            description: 'Lista de tipos de identificación',
            type: [TipoIdentificacionDto],
        }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FindClientBodyDto } from '../dto/request/find-client-body.dto';
import { FindClientResponseDto } from '../dto/response/find-client-response.dto';

export const FindClientDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Buscar clientes',
            description:
                'Búsqueda por identificación, razón social o combinación de ambos. ' +
                'Filtrada por empresa del JWT (multi-tenant). ' +
                'Migrado desde POST /clients/find (Express legacy).',
        }),
        ApiBody({ type: FindClientBodyDto }),
        ApiOkResponse({
            description: 'Lista de clientes que coinciden con la búsqueda',
            type: [FindClientResponseDto],
        }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
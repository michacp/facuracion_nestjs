import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiBadRequestResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SaveClientBodyDto } from '../dto/request/save-client-body.dto';
import { SaveClientResponseDto } from '../dto/response/save-client-response.dto';

export const SaveClientDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Crear nuevo cliente',
            description:
                'Registra un cliente asociado a la empresa del JWT (multi-tenant). ' +
                'Retorna id y nombre formateado para usar en selectores. ' +
                'Migrado desde POST /clients/save (Express legacy).',
        }),
        ApiBody({ type: SaveClientBodyDto }),
        ApiOkResponse({
            description: 'Cliente creado',
            type: SaveClientResponseDto,
        }),
        ApiBadRequestResponse({ description: 'Datos de entrada inválidos o identificación duplicada' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
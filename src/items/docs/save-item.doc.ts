import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiBadRequestResponse,
    ApiUnauthorizedResponse,
    ApiNotFoundResponse,
} from '@nestjs/swagger';
import { SaveItemBodyDto } from '../dto/request/save-item-body.dto';
import { SaveItemResponseDto } from '../dto/response/save-item-response.dto';

export const SaveItemDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Crear nuevo ítem (producto o servicio)',
            description:
                'Crea un ítem con código autogenerado por prefijo de tipo. ' +
                'Los modelos compatibles se asocian si se envían. ' +
                'El empresa_id se toma del JWT (multi-tenant). ' +
                'Migrado desde POST /products/save (Express legacy).',
        }),
        ApiBody({ type: SaveItemBodyDto }),
        ApiOkResponse({
            description: 'Ítem creado exitosamente',
            type: SaveItemResponseDto,
        }),
        ApiBadRequestResponse({ description: 'Datos de entrada inválidos' }),
        ApiNotFoundResponse({ description: 'Tipo de ítem no encontrado' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
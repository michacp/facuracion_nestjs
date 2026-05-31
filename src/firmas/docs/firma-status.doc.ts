import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FirmaStatusResponseDto } from '../dto/response/firma-status-response.dto';

export const FirmaStatusDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Estado de la firma electrónica activa',
            description:
                'Retorna los datos de la firma activa de la empresa del JWT. ' +
                'Devuelve null si no existe ninguna firma registrada. ' +
                'Migrado desde GET /signature/status (Express legacy).',
        }),
        ApiOkResponse({
            description: 'Firma activa encontrada o null si no existe',
            type: FirmaStatusResponseDto,
        }),
        ApiNotFoundResponse({ description: 'No existe firma activa para la empresa' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiOkResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetNewDataComprasResponseDto } from '../../catalogos/dto/response/get-new-data-compras-response.dto';

export const GetNewDataComprasDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Datos iniciales para formulario de compras',
            description:
                'Devuelve tipos de documento, estados de pago, tipos de identificación y países. ' +
                'Todos los catálogos son globales delegados a CatalogosService.',
        }),
        ApiOkResponse({ type: GetNewDataComprasResponseDto }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiOkResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetNewDataProveedorResponseDto } from '../dto/response/get-new-data-proveedor-response.dto';

export const GetNewDataProveedorDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Datos iniciales para formulario de proveedores',
            description:
                'Devuelve tipos de identificación SRI y países disponibles. ' +
                'Ambos catálogos son globales, delegados a CatalogosService.',
        }),
        ApiOkResponse({ type: GetNewDataProveedorResponseDto }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
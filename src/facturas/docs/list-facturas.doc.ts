import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ListFacturasBodyDto } from '../dto/request/list-facturas-body.dto';
import { ListFacturasResponseDto } from '../dto/response/list-facturas-response.dto';

export const ListFacturasDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Listar facturas electrónicas paginadas',
            description:
                'Devuelve facturas de la empresa del JWT con filtros opcionales. ' +
                'Filtros: búsqueda por número/clave, estado SRI y rango de fechas.',
        }),
        ApiBody({ type: ListFacturasBodyDto }),
        ApiOkResponse({ type: ListFacturasResponseDto }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ReporteInventarioResponseDto } from '../dto/response/reporte-inventario-response.dto';

export const ReporteInventarioDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Inventario valorado (Costo Promedio Ponderado)',
            description:
                'Calcula el valor del inventario actual usando CPP: ' +
                'promedia el costo de todos los lotes activos de cada ítem, ' +
                'ponderado por la cantidad restante en cada lote. ' +
                'Incluye desglose por lote para auditoría.',
        }),
        ApiOkResponse({ type: ReporteInventarioResponseDto }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
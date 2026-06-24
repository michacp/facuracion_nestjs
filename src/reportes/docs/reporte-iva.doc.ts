import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ReporteIvaBodyDto } from '../dto/request/reporte-iva-body.dto';
import { ReporteIvaResponseDto } from '../dto/response/reporte-iva-response.dto';

export const ReporteIvaDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Reporte de IVA mensual (apoyo para formulario 104)',
            description:
                'Resume ventas y compras del período agrupadas por tarifa de IVA, ' +
                'con el detalle transaccional de cada línea para auditoría. ' +
                'No reemplaza el formulario 104 del SRI — entrega los totales base ' +
                'que el contador digita manualmente en el portal.',
        }),
        ApiBody({ type: ReporteIvaBodyDto }),
        ApiOkResponse({ type: ReporteIvaResponseDto }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
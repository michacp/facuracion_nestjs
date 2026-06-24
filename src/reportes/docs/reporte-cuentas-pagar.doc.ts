import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ReporteCuentasPagarResponseDto } from '../dto/response/reporte-cuentas-pagar-response.dto';

export const ReporteCuentasPagarDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Cuentas por pagar a proveedores',
            description:
                'Lista compras con saldo pendiente, agrupadas por proveedor, ' +
                'con antigüedad en días desde la fecha de emisión.',
        }),
        ApiOkResponse({ type: ReporteCuentasPagarResponseDto }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
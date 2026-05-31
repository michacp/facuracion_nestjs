import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiNotFoundResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SyncFacturaBodyDto } from '../dto/request/sync-factura-body.dto';
import { SyncFacturaResponseDto } from '../dto/response/sync-factura-response.dto';

export const SyncFacturaDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Sincronizar estado de factura con el SRI',
            description:
                'Consulta el estado actual de la factura en el SRI usando la clave de acceso. ' +
                'Actualiza el estado en BD si cambió (ej: PENDIENTE→AUTORIZADO, AUTORIZADO→ANULADO). ' +
                'Si el XML en Drive fue eliminado accidentalmente, lo regenera desde la respuesta del SRI. ' +
                'Útil para facturas PENDIENTES, DEVUELTAS o verificar anulaciones manuales en el portal SRI.',
        }),
        ApiBody({ type: SyncFacturaBodyDto }),
        ApiOkResponse({ type: SyncFacturaResponseDto }),
        ApiNotFoundResponse({ description: 'Factura no encontrada' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
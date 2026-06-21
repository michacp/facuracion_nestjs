import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiBadRequestResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RetryFacturaBodyDto } from '../dto/request/retry-factura-body.dto';
import { RetryFacturaResponseDto } from '../dto/response/retry-factura-response.dto';

export const RetryFacturaDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Reintentar envío de factura al SRI',
            description:
                'Reenvía al SRI el XML original guardado en Drive. ' +
                'Solo disponible para facturas en estado PENDIENTE o DEVUELTA. ' +
                'Usa el XML original para preservar la fecha de emisión correcta — ' +
                'el SRI multa si la fecha del comprobante no coincide con el día de emisión. ' +
                'El número de secuencial no cambia.',
        }),
        ApiBody({ type: RetryFacturaBodyDto }),
        ApiOkResponse({ type: RetryFacturaResponseDto }),
        ApiBadRequestResponse({
            description: 'Factura no reintentable, SRI caído o XML no encontrado',
        }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiNotFoundResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PrintSaleBodyDto } from '../dto/request/print-sale-body.dto';
import { PdfResponseDto } from '../dto/response/pdf-response.dto';

export const A4PdfDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Generar factura PDF formato A4',
            description:
                'Genera la factura/comprobante en formato A4 formal. ' +
                'Incluye campos adicionales del cliente y datos SRI si aplica.',
        }),
        ApiBody({ type: PrintSaleBodyDto }),
        ApiOkResponse({ type: PdfResponseDto }),
        ApiNotFoundResponse({ description: 'Venta no encontrada' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
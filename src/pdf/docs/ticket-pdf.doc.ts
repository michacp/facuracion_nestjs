import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiNotFoundResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PrintSaleBodyDto } from '../dto/request/print-sale-body.dto';
import { PdfResponseDto } from '../dto/response/pdf-response.dto';

export const TicketPdfDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Generar ticket PDF (impresora térmica 58mm)',
            description:
                'Genera el ticket de venta en formato térmico 208px. ' +
                'Si tiene factura electrónica incluye datos SRI y código de barras. ' +
                'Incluye campos adicionales del cliente (ej: Lugar de entrega). ' +
                'Multi-tenant: solo ventas de la empresa del JWT.',
        }),
        ApiBody({ type: PrintSaleBodyDto }),
        ApiOkResponse({ type: PdfResponseDto }),
        ApiNotFoundResponse({ description: 'Venta no encontrada' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
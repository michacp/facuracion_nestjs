import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiBadRequestResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SaveSaleBodyDto } from '../dto/request/save-sale-body.dto';
import { SaveSaleResponseDto } from '../dto/response/save-sale-response.dto';

export const SaveSaleDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Registrar nueva venta',
            description:
                'Crea la venta con sus detalles. ' +
                'Productos (es_servicio=false): descuenta stock del lote y valida disponibilidad. ' +
                'Servicios (es_servicio=true): se registran en detalle_venta con lote_id=null, sin afectar inventario. ' +
                'El número de venta se autogenera por tipo de comprobante. ' +
                'La sucursal MATRIZ se asigna automáticamente desde la empresa del JWT. ' +
                'Generación de factura electrónica pendiente (módulo separado). ' +
                'Migrado desde POST /sales/save (Express legacy).',
        }),
        ApiBody({ type: SaveSaleBodyDto }),
        ApiOkResponse({
            description: 'Venta registrada correctamente',
            type: SaveSaleResponseDto,
        }),
        ApiBadRequestResponse({
            description: 'Sin productos, stock insuficiente o tipo de comprobante inválido',
        }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
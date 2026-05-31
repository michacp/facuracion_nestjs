import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiConsumes,
    ApiBody,
    ApiOkResponse,
    ApiBadRequestResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SaveFirmaResponseDto } from '../dto/response/save-firma-response.dto';

export const SaveFirmaDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Subir o reemplazar firma electrónica (.p12)',
            description:
                'Sube el archivo .p12 a Google Drive bajo la carpeta del ambiente ' +
                '(facturacion o facturacion_dev) en la ruta empresaId/firmas. ' +
                'Si ya existe una firma para la empresa, reemplaza el archivo en Drive y actualiza el registro. ' +
                'La contraseña se almacena cifrada con Cryptr. ' +
                'Migrado desde POST /signature/save (Express legacy).',
        }),
        ApiConsumes('multipart/form-data'),
        ApiBody({
            schema: {
                type: 'object',
                required: ['file', 'password'],
                properties: {
                    file: {
                        type: 'string',
                        format: 'binary',
                        description: 'Archivo .p12 o .pfx de la firma electrónica',
                    },
                    password: {
                        type: 'string',
                        description: 'Contraseña del archivo .p12',
                    },
                },
            },
        }),
        ApiOkResponse({
            description: 'Firma subida o actualizada correctamente',
            type: SaveFirmaResponseDto,
        }),
        ApiBadRequestResponse({
            description: 'Archivo no enviado, formato inválido o contraseña incorrecta',
        }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
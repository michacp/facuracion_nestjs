import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EditItemBodyDto } from '../dto/request/edit-item-body.dto';

export const EditItemDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Editar ítem existente',
            description:
                'Actualiza nombre, descripción, precio y tarifa del ítem. ' +
                'Sincroniza modelos compatibles (agrega nuevos, elimina los que falten). ' +
                'Actualiza cantidad de lotes si se envían. ' +
                'Valida que el ítem pertenezca a la empresa del JWT (multi-tenant). ' +
                'Migrado desde POST /products/editproduct (Express legacy).',
        }),
        ApiBody({ type: EditItemBodyDto }),
        ApiOkResponse({ description: 'Ítem actualizado correctamente' }),
        ApiBadRequestResponse({ description: 'Datos de entrada inválidos' }),
        ApiNotFoundResponse({ description: 'Ítem no encontrado o no pertenece a la empresa' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
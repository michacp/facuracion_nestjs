import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GetNewDataResponseDto } from '../dto/response/get-new-data-response.dto';

export function GetNewDataDoc() {
    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({
            summary: 'Obtener catálogos de inicialización para productos',
            description: 'Retorna las marcas, tipos de impuestos y tipos de ítems necesarios para poblar los selectores del formulario de creación de productos.'
        }),
        ApiResponse({
            status: 200,
            description: 'Catálogos obtenidos exitosamente.',
            type: GetNewDataResponseDto
        }),
        ApiResponse({
            status: 401,
            description: 'No autorizado. Token faltante o inválido.'
        }),
        ApiResponse({
            status: 500,
            description: 'Error interno del servidor al procesar la consulta.'
        })
    );
}
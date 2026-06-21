import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiOkResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EmpresaProfileResponseDto } from '../dto/response/empresa-profile-response.dto';

export const GetEmpresaProfileDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Obtener perfil completo de la empresa',
            description:
                'Devuelve datos de la empresa, sucursales, usuarios, firma electrónica ' +
                'y suscripción activa. Incluye catálogos para los selects de edición.',
        }),
        ApiOkResponse({ type: EmpresaProfileResponseDto }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
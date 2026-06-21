import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation, ApiBody, ApiOkResponse,
    ApiBadRequestResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UpdateEmpresaBodyDto } from '../dto/request/update-empresa-body.dto';

export const UpdateEmpresaDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Actualizar datos de la empresa',
            description:
                'Edita los datos de la empresa del JWT. ' +
                'El RUC no es editable. ' +
                'Solo enviar los campos que cambian.',
        }),
        ApiBody({ type: UpdateEmpresaBodyDto }),
        ApiOkResponse({ description: 'Empresa actualizada correctamente' }),
        ApiBadRequestResponse({ description: 'Datos inválidos o email duplicado' }),
        ApiUnauthorizedResponse({ description: 'Token JWT ausente o expirado' }),
    );
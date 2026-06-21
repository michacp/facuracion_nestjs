// src/catalogos/docs/get-roles.doc.ts
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { SelectOptionDto } from '../dto/response/select-option.dto';

export function GetRolesDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Lista de roles de usuario',
            description:
                'Devuelve los roles disponibles (id, name) para asignar a un usuario dentro de una empresa (UsuarioEmpresa).',
        }),
        ApiOkResponse({ type: [SelectOptionDto] }),
    );
}
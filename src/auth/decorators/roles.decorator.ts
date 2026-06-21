import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Define qué roles pueden acceder al endpoint.
 * Uso: @Roles('ADMINISTRADOR', 'SUPERADMIN')
 * Si no se usa este decorador, el endpoint es accesible para cualquier rol autenticado.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
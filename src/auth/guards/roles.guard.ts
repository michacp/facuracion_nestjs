import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ADMIN_ROLE_RANK } from '../constants/roles-hierarchy';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // Sin @Roles() → no restringe, cualquier autenticado pasa
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user: JwtPayload = request.user;

        if (!user?.rol) {
            throw new ForbiddenException('No se pudo determinar el rol del usuario');
        }

        if (this.tieneAcceso(user.rol, requiredRoles)) {
            return true;
        }

        throw new ForbiddenException(
            `Acceso denegado. Se requiere uno de estos roles: ${requiredRoles.join(', ')}`,
        );
    }

    private tieneAcceso(userRole: string, requiredRoles: string[]): boolean {
        // 1. Coincidencia exacta — siempre pasa
        if (requiredRoles.includes(userRole)) {
            return true;
        }

        const userRank = ADMIN_ROLE_RANK[userRole];

        // Usuario con rol operativo (no admin) sin match exacto → denegado
        if (userRank === undefined) {
            return false;
        }

        // 2. Usuario es admin — ver si la regla incluye roles admin
        const requiredAdminRanks = requiredRoles
            .map((r) => ADMIN_ROLE_RANK[r])
            .filter((rank): rank is number => rank !== undefined);

        if (requiredAdminRanks.length === 0) {
            // La regla es puramente de roles operativos (FACTURADOR, CONTADOR...)
            // → los admins siempre tienen acceso a lo operativo
            return true;
        }

        // 3. La regla exige rol(es) admin → comparar por rango
        const minRangoExigido = Math.min(...requiredAdminRanks);
        return userRank >= minRangoExigido;
    }
}
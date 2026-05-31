//src\auth\guards\jwt-auth.guard.ts
import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    /**
     * Captura errores de Passport y devuelve un mensaje limpio.
     * Sin esto NestJS lanza un 401 con el mensaje crudo de Passport.
     */
    handleRequest<T = any>(err: any, user: T, info: any): T {
        if (err || !user) {
            const message =
                info?.name === 'TokenExpiredError'
                    ? 'El token ha expirado. Por favor inicie sesión nuevamente.'
                    : 'Token inválido o no proporcionado.';
            throw new UnauthorizedException(message);
        }
        return user;
    }

    /**
     * Permite activar el guard en contextos HTTP y WS/GraphQL
     * sin modificar nada más.
     */
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }
}
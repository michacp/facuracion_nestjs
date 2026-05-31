import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
    (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as JwtPayload;

        // Si le pasas una propiedad específica (ej: @CurrentUser('empresaId')), devuelve solo eso
        return data ? user?.[data] : user;
    },
);
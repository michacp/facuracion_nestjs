import {
    Injectable,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto'
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { checkSubscriptionAccess } from './helpers/subscription.helper';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) { }

    async login(dto: LoginDto) {
        const { usernameOrEmail, password, rememberMe } = dto;

        // ── 1. Buscar usuario ──────────────────────────────────────────────────
        const user = await this.prisma.usuario.findFirst({
            where: {
                OR: [
                    { usuarios_username: usernameOrEmail },
                    { usuarios_email: usernameOrEmail },
                ],
            },
        });

        // Mensaje genérico — no revelar si el usuario existe o no
        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // ── 2. Verificar si está activo ────────────────────────────────────────
        if (!user.usuarios_activo) {
            throw new ForbiddenException(
                'Usuario inactivo. Contacte al administrador.',
            );
        }

        // ── 3. Validar contraseña ──────────────────────────────────────────────
        const validPassword = await bcrypt.compare(
            password,
            user.usuarios_password,
        );
        if (!validPassword) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // ── 4. Obtener empresa, rol y suscripción del usuario ──────────────────
        const usuarioEmpresa = await this.prisma.usuarioEmpresa.findFirst({
            where: { usuario_empresa_usuarioId: user.usuarios_id },
            include: {
                empresa: {
                    include: {
                        suscripcion: {
                            include: { plan: true },
                        },
                    },
                },
                rol: true,
            },
        });

        // ── 5. Validar empresa y suscripción ───────────────────────────────────
        if (usuarioEmpresa) {
            const { empresa } = usuarioEmpresa;

            if (!empresa.empresas_activa) {
                throw new ForbiddenException(
                    'La empresa está deshabilitada. Contacte al soporte.',
                );
            }

            // Lanza ForbiddenException si está VENCIDA, SUSPENDIDA o CANCELADA
            checkSubscriptionAccess(empresa.suscripcion);
        }

        // ── 6. Construir payload del JWT ───────────────────────────────────────
        const payload: JwtPayload = {
            sub: user.usuarios_id,
            username: user.usuarios_username,
            email: user.usuarios_email,
            empresaId: usuarioEmpresa?.empresa.empresas_id ?? null,
            empresaNombre: usuarioEmpresa?.empresa.empresas_nombreComercial ?? null,
            rol: usuarioEmpresa?.rol.rol_nombre ?? null,
            planNombre: usuarioEmpresa?.empresa.suscripcion?.plan.plan_nombre ?? null,
            suscripcionEstado: usuarioEmpresa?.empresa.suscripcion?.estado ?? null,
        };
        console.log(usuarioEmpresa?.empresa.suscripcion?.plan.plan_nombre)
        // ── 7. Firmar token ────────────────────────────────────────────────────
        const defaultExpires = this.config.get<string>('JWT_EXPIRES', '1d');
        const expiresIn = rememberMe ? '7d' : defaultExpires;
        const access_token = this.jwtService.sign(payload, {
            expiresIn: expiresIn as any,   // o como ms.StringValue
        });

        // ── 8. Respuesta ───────────────────────────────────────────────────────
        return {
            access_token,
            user: {
                id: user.usuarios_id,
                username: user.usuarios_username,
                email: user.usuarios_email,
                nombre: user.usuarios_nombre,
                empresa: usuarioEmpresa
                    ? {
                        id: usuarioEmpresa.empresa.empresas_id,
                        razonSocial: usuarioEmpresa.empresa.empresas_razonSocial,
                        nombreComercial: usuarioEmpresa.empresa.empresas_nombreComercial,
                    }
                    : null,
                rol: usuarioEmpresa?.rol.rol_nombre ?? null,
                plan: usuarioEmpresa?.empresa.suscripcion?.plan.plan_nombre ?? null,
                suscripcionEstado: usuarioEmpresa?.empresa.suscripcion?.estado ?? null,
            },
        };
    }
}
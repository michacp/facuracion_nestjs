import { EstadoSuscripcion } from '@prisma/client';
export interface JwtPayload {
    /** ID del usuario */
    sub: number;
    username: string;
    email: string;

    // ── Multi-tenant ──────────────────────────────
    empresaId: number | null;
    empresaNombre?: string | null;
    rol: string | null;

    // ── Suscripción (para guards de plan en rutas) ─
    planNombre: string | null;
    suscripcionEstado: EstadoSuscripcion | null;
}
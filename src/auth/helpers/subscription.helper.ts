import { ForbiddenException } from '@nestjs/common';
import { EstadoSuscripcion, Suscripcion, Plan } from '@prisma/client';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SuscripcionConPlan = (Suscripcion & { plan: Plan }) | null | undefined;

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Estados que impiden el acceso al sistema */
const ESTADOS_BLOQUEANTES: EstadoSuscripcion[] = [
    EstadoSuscripcion.VENCIDA,
    EstadoSuscripcion.SUSPENDIDA,
    EstadoSuscripcion.CANCELADA,
];

const MENSAJES_BLOQUEO: Partial<Record<EstadoSuscripcion, string>> = {
    [EstadoSuscripcion.VENCIDA]:
        'La suscripción ha vencido. Por favor renueve su plan para continuar.',
    [EstadoSuscripcion.SUSPENDIDA]:
        'La suscripción está suspendida. Contacte al soporte técnico.',
    [EstadoSuscripcion.CANCELADA]:
        'La suscripción ha sido cancelada.',
};

// ─── Helper principal ─────────────────────────────────────────────────────────

/**
 * Verifica que la suscripción permita acceso al sistema.
 * Lanza ForbiddenException si el estado bloquea el acceso.
 *
 * Uso:
 *   checkSubscriptionAccess(empresa.suscripcion);
 */
export function checkSubscriptionAccess(suscripcion: SuscripcionConPlan): void {
    if (!suscripcion) {
        throw new ForbiddenException(
            'La empresa no tiene una suscripción activa. Contacte al soporte.',
        );
    }

    if (ESTADOS_BLOQUEANTES.includes(suscripcion.estado)) {
        const mensaje =
            MENSAJES_BLOQUEO[suscripcion.estado] ??
            `Acceso denegado. Estado de suscripción: ${suscripcion.estado}`;
        throw new ForbiddenException(mensaje);
    }
}

// ─── Helper auxiliar: ¿el plan tiene límite en X? ─────────────────────────────

/**
 * Devuelve true si el valor supera el límite del plan.
 * Un límite de -1 significa "sin límite" (plan OWNED).
 *
 * Uso:
 *   if (exceedsLimit(empresa.suscripcion?.plan.max_facturas_mes, totalMes)) {
 *     throw new ForbiddenException('Límite de facturas del mes alcanzado');
 *   }
 */
export function exceedsLimit(limit: number, current: number): boolean {
    if (limit === -1) return false; // sin límite
    return current >= limit;
}
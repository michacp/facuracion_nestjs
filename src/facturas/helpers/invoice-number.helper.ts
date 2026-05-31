import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoiceNumberHelper implements OnModuleInit {
    private readonly logger = new Logger(InvoiceNumberHelper.name);

    private estadoReservadoId!: number;
    private estadoUsadoId!: number;
    private estadoLibreId!: number;
    private estadoOcupadoId!: number; // ← enviado al SRI, resultado incierto

    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        const estados = await this.prisma.estadoNumeracion.findMany({
            select: { estado_id: true, estado_nombre: true },
        });

        const get = (nombre: string) => {
            const e = estados.find((x) => x.estado_nombre === nombre);
            if (!e) throw new Error(`Estado "${nombre}" no encontrado. Ejecuta el seed.`);
            return e.estado_id;
        };

        this.estadoReservadoId = get('RESERVADO');
        this.estadoUsadoId = get('USADO');
        this.estadoLibreId = get('LIBRE');
        this.estadoOcupadoId = get('OCUPADO'); // ← nuevo

        this.logger.log(
            `✅ Estados numeración: RESERVADO=${this.estadoReservadoId} ` +
            `USADO=${this.estadoUsadoId} LIBRE=${this.estadoLibreId} OCUPADO=${this.estadoOcupadoId}`,
        );
    }

    // ── Obtener número libre ─────────────────────────────────────────────
    async obtenerNumeroFactura(sucursalId: number): Promise<number> {
        return this.prisma.$transaction(async (tx) => {

            // Buscar LIBRE para reutilizar
            const libre = await tx.facturaNumeracion.findFirst({
                where: { sucursal_id: sucursalId, estado_id: this.estadoLibreId },
                orderBy: { numero: 'asc' },
                select: { numeracion_id: true, numero: true },
            });

            if (libre) {
                await tx.facturaNumeracion.update({
                    where: { numeracion_id: libre.numeracion_id },
                    data: { estado_id: this.estadoReservadoId },
                });
                this.logger.log(`♻️ Reutilizando número LIBRE: ${libre.numero}`);
                return libre.numero;
            }

            // Generar siguiente
            const ultimo = await tx.facturaNumeracion.findFirst({
                where: { sucursal_id: sucursalId },
                orderBy: { numero: 'desc' },
                select: { numero: true },
            });

            const siguiente = (ultimo?.numero ?? 0) + 1;

            await tx.facturaNumeracion.create({
                data: {
                    sucursal_id: sucursalId,
                    numero: siguiente,
                    estado_id: this.estadoReservadoId,
                    fecha_generacion: new Date(),
                },
            });

            this.logger.log(`🆕 Nuevo número generado: ${siguiente}`);
            return siguiente;
        });
    }

    // ── RESERVADO → OCUPADO (justo antes de enviar al SRI) ──────────────
    // Así si el proceso muere, el número queda en OCUPADO (no se reutiliza)
    async marcarNumeroOcupado(sucursalId: number, numero: number): Promise<void> {
        await this.prisma.facturaNumeracion.updateMany({
            where: { sucursal_id: sucursalId, numero },
            data: { estado_id: this.estadoOcupadoId },
        });
        this.logger.log(`📤 Número ${numero} marcado OCUPADO (enviando a SRI)`);
    }

    // ── OCUPADO/RESERVADO → USADO (autorizado o secuencial ya registrado) ─
    async marcarNumeroUsado(sucursalId: number, numero: number): Promise<void> {
        await this.prisma.facturaNumeracion.updateMany({
            where: { sucursal_id: sucursalId, numero },
            data: { estado_id: this.estadoUsadoId },
        });
        this.logger.log(`✅ Número ${numero} marcado USADO`);
    }

    // ── RESERVADO → LIBRE (error ANTES de enviar al SRI) ─────────────────
    // Solo liberar si el número NUNCA llegó al SRI
    async liberarNumeroFactura(sucursalId: number, numero: number): Promise<void> {
        await this.prisma.facturaNumeracion.updateMany({
            where: { sucursal_id: sucursalId, numero, estado_id: this.estadoReservadoId },
            data: { estado_id: this.estadoLibreId },
        });
        this.logger.log(`🔓 Número ${numero} liberado (nunca llegó al SRI)`);
    }
}
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as gsmarena from 'gsmarena-api';

// ─────────────────────────────────────────────────────────────────
// TIPOS DE gsmarena-api  (el paquete no incluye @types, los declaramos aquí)
// ─────────────────────────────────────────────────────────────────

/** Marca tal como la devuelve gsmarena.catalog.getBrands() */
interface GsmBrand {
    id: string;
    name: string;
    devices: number;
}

/** Dispositivo tal como lo devuelve gsmarena.catalog.getBrand(brandId) */
interface GsmDevice {
    id: string;
    name: string;
    img?: string;
    description?: string;
}

// Helper tipado: evita usar `as any` disperso en el código
const gsmCatalog = gsmarena.catalog as {
    getBrands: () => Promise<GsmBrand[]>;
    getBrand: (brandId: string) => Promise<GsmDevice[]>;
};

// ─────────────────────────────────────────────────────────────────
// TIPOS INTERNOS
// ─────────────────────────────────────────────────────────────────

interface SyncStats {
    brandsChecked: number;
    brandsUpserted: number;
    modelsInserted: number;
    brandsFailed: string[];
    startedAt: Date;
    finishedAt?: Date;
    durationMs?: number;
}

// ─────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────

/** Pausa base entre marcas para no disparar el WAF de GSM Arena */
const DELAY_BETWEEN_BRANDS_MS = 5_000;

/** Pausa base cuando recibimos 429 (si no hay Retry-After header) */
const BACKOFF_BASE_SECONDS = 15;

/** Máximo de reintentos por petición */
const MAX_RETRIES = 5;

/** Timeout por petición (ms) */
const REQUEST_TIMEOUT_MS = 30_000;

const delay = (ms: number): Promise<void> =>
    new Promise((res) => setTimeout(res, ms));

// ─────────────────────────────────────────────────────────────────
// SERVICIO
// ─────────────────────────────────────────────────────────────────

@Injectable()
export class GsmArenaService implements OnModuleInit {
    private readonly logger = new Logger(GsmArenaService.name);

    /** Evita ejecuciones solapadas si el cron se dispara mientras hay una activa */
    private syncInProgress = false;

    constructor(private readonly prisma: PrismaService) { }

    // ───────────────────────────────────────────────────────────────
    // LIFECYCLE
    // ───────────────────────────────────────────────────────────────

    async onModuleInit() {
        this.logger.log('🚀 GsmArenaService inicializado.');

        const runOnStart = process.env.RUN_GSM_SYNC_ON_START === 'true';

        if (runOnStart) {
            this.logger.log('🔄 Iniciando sincronización en segundo plano...');

            // ← Esta es la forma recomendada
            // this.runFullSync()
            //     .then(() => this.logger.log('✅ Sincronización en background finalizada'))
            //     .catch(err => this.logger.error('❌ Error en sincronización background:', err));
        }
    }

    // ───────────────────────────────────────────────────────────────
    // CRON: todos los días a medianoche hora Ecuador
    // ───────────────────────────────────────────────────────────────

    @Cron('15 0 * * *', { timeZone: 'America/Guayaquil' })
    async handleCronSync(): Promise<void> {
        if (this.syncInProgress) {
            this.logger.warn('⚠️  Ya hay una sincronización en curso. Saltando disparo del CRON.');
            return;
        }

        this.logger.log('⏰ CRON disparado: iniciando sincronización con GSM Arena...');
        await this.runFullSync();
    }

    // ───────────────────────────────────────────────────────────────
    // PUNTO DE ENTRADA PÚBLICO (también usable desde un endpoint de admin)
    // ───────────────────────────────────────────────────────────────

    async runFullSync(): Promise<SyncStats> {
        if (this.syncInProgress) {
            throw new Error('Sincronización ya en progreso.');
        }

        this.syncInProgress = true;
        const stats: SyncStats = {
            brandsChecked: 0,
            brandsUpserted: 0,
            modelsInserted: 0,
            brandsFailed: [],
            startedAt: new Date(),
        };

        try {
            await this.scanBrands(stats);
            stats.finishedAt = new Date();
            stats.durationMs = stats.finishedAt.getTime() - stats.startedAt.getTime();

            this.logger.log(
                `✅ Sincronización completada en ${(stats.durationMs / 1000).toFixed(1)}s | ` +
                `Marcas revisadas: ${stats.brandsChecked} | Upserted: ${stats.brandsUpserted} | ` +
                `Modelos insertados: ${stats.modelsInserted} | ` +
                `Marcas fallidas: ${stats.brandsFailed.length || 0}`,
            );

            if (stats.brandsFailed.length) {
                this.logger.warn(`⚠️  Marcas con errores: ${stats.brandsFailed.join(', ')}`);
            }

            return stats;
        } catch (error: any) {
            this.logger.error('❌ Falla crítica en la sincronización', error.stack);
            throw error;
        } finally {
            // Siempre libera el lock aunque falle
            this.syncInProgress = false;
        }
    }

    // ───────────────────────────────────────────────────────────────
    // PETICIONES SEGURAS: Backoff Exponencial + Timeout
    // ───────────────────────────────────────────────────────────────

    private async safeRequest<T>(
        fn: () => Promise<T>,
        context: string,
        retries = MAX_RETRIES,
        backoffMultiplier = 1,
    ): Promise<T> {
        // Envuelve la función con un timeout para evitar cuelgues
        const withTimeout = (): Promise<T> =>
            Promise.race([
                fn(),
                new Promise<never>((_, reject) =>
                    setTimeout(
                        () => reject(new Error(`Timeout en ${context} tras ${REQUEST_TIMEOUT_MS}ms`)),
                        REQUEST_TIMEOUT_MS,
                    ),
                ),
            ]);

        try {
            return await withTimeout();
        } catch (err: any) {
            // ── 429: Rate limit ────────────────────────────────────────
            if (err?.response?.status === 429) {
                if (retries <= 0) {
                    throw new Error(`❌ Sin reintentos restantes tras 429 en ${context}.`);
                }

                const retryAfterHeader = err.response.headers?.['retry-after'];
                const baseWait = retryAfterHeader ? Number(retryAfterHeader) : BACKOFF_BASE_SECONDS;
                const waitMs = baseWait * backoffMultiplier * 1_000;

                this.logger.warn(
                    `🚫 429 en "${context}". Esperando ${(waitMs / 1000).toFixed(1)}s ` +
                    `(backoff x${backoffMultiplier}, reintentos restantes: ${retries - 1})`,
                );
                await delay(waitMs);

                return this.safeRequest(fn, context, retries - 1, backoffMultiplier * 1.5);
            }

            // ── Timeout u otro error de red → reintento simple ────────
            if (retries > 0 && (err.code === 'ECONNRESET' || err.message?.includes('Timeout'))) {
                const waitMs = 5_000 * backoffMultiplier;
                this.logger.warn(
                    `🔁 Error de red en "${context}" (${err.message}). Reintentando en ${waitMs / 1000}s...`,
                );
                await delay(waitMs);
                return this.safeRequest(fn, context, retries - 1, backoffMultiplier * 1.5);
            }

            throw err;
        }
    }

    // ───────────────────────────────────────────────────────────────
    // ESCANEAR MARCAS
    // ───────────────────────────────────────────────────────────────

    private async scanBrands(stats: SyncStats): Promise<void> {
        this.logger.log('📡 Solicitando catálogo de marcas a GSM Arena...');

        const brands = await this.safeRequest(
            () => gsmCatalog.getBrands(),
            'getBrands',
        );

        if (!brands?.length) {
            this.logger.warn('⚠️  GSM Arena devolvió un catálogo de marcas vacío.');
            return;
        }

        stats.brandsChecked = brands.length;
        this.logger.log(`📋 ${brands.length} marcas recibidas desde GSM Arena.`);

        // Cargar estado actual en un Map para comparación O(1)
        const existingBrands = await this.prisma.brand.findMany({
            select: {
                brands_id: true,
                brands_find_id: true,
                brands_devices_count: true,
            },
        });

        const brandMap = new Map(
            existingBrands.map((b) => [
                b.brands_find_id,
                { id: b.brands_id, count: b.brands_devices_count },
            ]),
        );

        // Solo procesamos marcas nuevas o con stock cambiado
        const changedBrands = brands.filter((b) => {
            const existing = brandMap.get(b.id);
            return !existing || existing.count !== b.devices;
        });

        if (!changedBrands.length) {
            this.logger.log('✅ Sin cambios en el catálogo de marcas. Nada que actualizar.');
            return;
        }

        this.logger.log(`⚡ ${changedBrands.length} marcas con cambios detectados. Iniciando upsert...`);

        // Upsert en lote usando transacción para atomicidad
        await this.prisma.$transaction(
            changedBrands.map((b) =>
                this.prisma.brand.upsert({
                    where: { brands_find_id: b.id },
                    update: {
                        brands_name: b.name,
                        brands_devices_count: b.devices,
                    },
                    create: {
                        brands_find_id: b.id,
                        brands_name: b.name,
                        brands_devices_count: b.devices,
                    },
                }),
            ),
        );

        stats.brandsUpserted = changedBrands.length;
        this.logger.log(`✅ ${changedBrands.length} marcas sincronizadas en la BD.`);

        // Recuperar los IDs internos para procesar modelos
        const refreshedBrands = await this.prisma.brand.findMany({
            where: { brands_find_id: { in: changedBrands.map((b) => b.id) } },
            select: { brands_id: true, brands_find_id: true },
        });

        await this.saveModels(refreshedBrands, stats);
    }

    // ───────────────────────────────────────────────────────────────
    // GUARDAR MODELOS
    // ───────────────────────────────────────────────────────────────

    private async saveModels(
        brands: Array<{ brands_id: number; brands_find_id: string }>,
        stats: SyncStats,
    ): Promise<void> {
        for (const [index, brand] of brands.entries()) {
            this.logger.log(
                `[${index + 1}/${brands.length}] 📡 Procesando modelos de: ${brand.brands_find_id}`,
            );

            // Pausa prudencial entre marcas
            if (index > 0) {
                await delay(DELAY_BETWEEN_BRANDS_MS);
            }

            try {
                const devices = await this.safeRequest(
                    () => gsmCatalog.getBrand(brand.brands_find_id),
                    `getBrand(${brand.brands_find_id})`,
                );

                if (!devices?.length) {
                    this.logger.warn(`⚠️  Sin modelos accesibles para: ${brand.brands_find_id}`);
                    continue;
                }

                // Cargamos los modelos ya existentes para esta marca
                const existingModels = await this.prisma.model.findMany({
                    where: { models_brands_id: brand.brands_id },
                    select: { models_find_id: true },
                });

                const existingSet = new Set(existingModels.map((m) => m.models_find_id));

                const newDevices = devices.filter((d) => !existingSet.has(d.id));

                if (!newDevices.length) {
                    this.logger.log(`  ⚡ ${brand.brands_find_id}: todo al día (${devices.length} modelos).`);
                    continue;
                }

                // Inserción en lote — skipDuplicates como red de seguridad adicional
                const result = await this.prisma.model.createMany({
                    data: newDevices.map((d) => ({
                        models_find_id: d.id,
                        models_name: d.name,
                        models_brands_id: brand.brands_id,
                        models_img_url: d.img ?? null,
                        models_description: d.description ?? null,
                    })),
                    skipDuplicates: true,
                });

                stats.modelsInserted += result.count;
                this.logger.log(
                    `  ✅ ${brand.brands_find_id}: ${result.count} nuevos modelos insertados.`,
                );
            } catch (error: any) {
                // Error por marca: registramos y continuamos con las demás
                stats.brandsFailed.push(brand.brands_find_id);
                this.logger.error(
                    `  ❌ Error procesando "${brand.brands_find_id}": ${error.message}`,
                    error.stack,
                );
            }
        }
    }
}
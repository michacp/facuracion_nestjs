// src/brands/brands-sync.service.ts
// Equivalente a: src/scraping/update_models_and_brands.js
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
// gsmarena-api no tiene tipos, usamos require
// eslint-disable-next-line @typescript-eslint/no-require-imports
const gsmarena = require('gsmarena-api');
import axios from 'axios';

// Tipo mínimo para las respuestas de gsmarena-api (sin tipos oficiales)
interface GsmBrand {
    id: string;
    name: string;
    devices: number;
}

interface GsmDevice {
    id: string;
    name: string;
    img?: string;
    description?: string;
}

// User-Agent para evitar detección (igual que en el legacy)
axios.defaults.headers.common['User-Agent'] =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

@Injectable()
export class BrandsSyncService {
    private readonly logger = new Logger(BrandsSyncService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─────────────────────────────────────────
    // Helper: delay
    // ─────────────────────────────────────────
    private delay(ms: number): Promise<void> {
        return new Promise((res) => setTimeout(res, ms));
    }

    // ─────────────────────────────────────────
    // Helper: safeRequest con retry en 429
    // ─────────────────────────────────────────
    private async safeRequest<T>(
        fn: () => Promise<T>,
        retries = 5,
    ): Promise<T> {
        try {
            return await fn();
        } catch (err: any) {
            if (err.response?.status === 429) {
                const retryAfterHeader = err.response.headers['retry-after'];
                const waitTime = (retryAfterHeader ? Number(retryAfterHeader) : 10) * 1000;

                this.logger.warn(
                    `🚫 429 detectado. Esperando ${waitTime / 1000}s antes de reintentar...`,
                );
                await this.delay(waitTime);

                if (retries > 0) {
                    this.logger.log(`🔁 Reintentando... (${retries} intentos restantes)`);
                    return this.safeRequest(fn, retries - 1);
                } else {
                    throw new Error('❌ Se agotaron los retries después de múltiples 429.');
                }
            }
            throw err;
        }
    }

    // ─────────────────────────────────────────
    // 🕛 Cron: cada día a medianoche (Guayaquil)
    // Equivalente a: cron.schedule('0 0 * * *', ..., { timezone: "America/Guayaquil" })
    // ─────────────────────────────────────────
    @Cron('0 0 * * *', {
        name: 'scanbrands',
        timeZone: 'America/Guayaquil',
    })
    async handleCron() {
        this.logger.log('⏰ Ejecutando scanbrands()...');
        try {
            await this.scanbrands();
            this.logger.log('✅ scanbrands() completado.');
        } catch (error) {
            this.logger.error(`❌ Error en scanbrands(): ${error.message}`);
        }
    }

    // ─────────────────────────────────────────
    // scanbrands() — equivalente 1:1 al legacy
    // ─────────────────────────────────────────
    async scanbrands(): Promise<void> {
        this.logger.log('📡 Obteniendo marcas desde GSM Arena...');

        // ✅ Tipo explícito → evita que TypeScript infiera unknown
        const brands = await this.safeRequest<GsmBrand[]>(() => gsmarena.catalog.getBrands());

        // Traer marcas existentes de la DB
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

        // Filtrar solo marcas con cambios (nueva o diferente device count)
        const updatedBrands = brands.filter((brand) => {
            const existing = brandMap.get(brand.id);
            return !existing || existing.count !== brand.devices;
        });

        if (updatedBrands.length === 0) {
            this.logger.log('✅ No hay cambios en las marcas.');
            return;
        }

        // Upsert marcas en PostgreSQL con Prisma
        // Prisma no tiene "INSERT ... ON DUPLICATE KEY UPDATE" directo,
        // usamos upsert en loop (o createMany + update por separado)
        for (const brand of updatedBrands) {
            await this.prisma.brand.upsert({
                where: { brands_find_id: brand.id },
                create: {
                    brands_find_id: brand.id,
                    brands_name: brand.name.toUpperCase(),
                    brands_devices_count: brand.devices,
                },
                update: {
                    brands_name: brand.name.toUpperCase(),
                    brands_devices_count: brand.devices,
                },
            });
        }

        this.logger.log('⚡ Marcas actualizadas en la base de datos.');

        // Traer los ids actualizados para sincronizar modelos
        const refreshedBrands = await this.prisma.brand.findMany({
            where: {
                brands_find_id: { in: updatedBrands.map((b: any) => b.id) },
            },
            select: { brands_id: true, brands_find_id: true },
        });

        await this.savemodels(refreshedBrands);
    }

    // ─────────────────────────────────────────
    // savemodels() — equivalente 1:1 al legacy
    // ─────────────────────────────────────────
    async savemodels(
        brands: { brands_id: number; brands_find_id: string }[],
    ): Promise<void> {
        for (const brand of brands) {
            this.logger.log(
                `📡 Obteniendo modelos de la marca: ${brand.brands_find_id}`,
            );

            // Anti-baneo: delay entre cada marca (igual que el legacy)
            await this.delay(4000);

            const devices = await this.safeRequest<GsmDevice[]>(() =>
                gsmarena.catalog.getBrand(brand.brands_find_id),
            );

            if (!devices.length) {
                this.logger.warn(
                    `❌ No hay modelos para la marca ${brand.brands_find_id}`,
                );
                continue;
            }

            // Modelos existentes para esta marca
            const existingModels = await this.prisma.model.findMany({
                where: { models_brands_id: brand.brands_id },
                select: { models_find_id: true },
            });

            const existingSet = new Set(existingModels.map((m) => m.models_find_id));

            const newDevices = devices.filter(
                (device) => !existingSet.has(device.id),
            );

            if (newDevices.length === 0) {
                this.logger.log(
                    `⚡ No hay cambios en los modelos de ${brand.brands_find_id}`,
                );
                continue;
            }

            await this.prisma.model.createMany({
                data: newDevices.map((device) => ({
                    models_find_id: device.id,
                    models_name: device.name.toUpperCase(),
                    models_brands_id: brand.brands_id,
                    models_img_url: device.img ?? null,
                    models_description: device.description ?? null,
                })),
                skipDuplicates: true, // Equivalente a ON DUPLICATE KEY UPDATE (ignore)
            });

            this.logger.log(
                `✅ Insertados ${newDevices.length} modelos nuevos para ${brand.brands_find_id}`,
            );
        }
    }
}
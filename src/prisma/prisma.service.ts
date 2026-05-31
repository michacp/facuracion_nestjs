import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    constructor() {
        // Crear el adapter para PostgreSQL
        const adapter = new PrismaPg({
            connectionString: process.env.DATABASE_URL,
        });

        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        console.log('✅ Prisma conectado correctamente con adapter-pg');
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
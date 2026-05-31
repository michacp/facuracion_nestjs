// prisma.config.ts  (raíz del proyecto, al lado de package.json)
// ✅ Prisma 7: este archivo maneja la URL para CLI (migrate, db push, studio, etc.)
// La conexión en runtime la maneja el adapter en PrismaService
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
});

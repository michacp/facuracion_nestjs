# backend-nestjs — Arquitectura del Proyecto

> Migración de **Express + MySQL** → **NestJS + PostgreSQL + Prisma**  
> Arquitectura: **Multi-tenant (row-level tenancy)** con suscripciones por empresa  
> Proyecto: **TeamCellMania** — Gestión de inventario y facturación electrónica (SRI Ecuador)

---

## Índice

1. [Contexto y decisiones de arquitectura](#1-contexto-y-decisiones-de-arquitectura)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Configuración inicial — comandos](#4-configuración-inicial--comandos)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Módulos del sistema](#6-módulos-del-sistema)
7. [Prisma Schema](#7-prisma-schema)
8. [Arquitectura multi-tenant](#8-arquitectura-multi-tenant)
9. [Seeding — Catálogos globales](#9-seeding--catálogos-globales)
10. [Archivos implementados — Fase 1](#10-archivos-implementados--fase-1)
11. [Equivalencias Legacy → NestJS](#11-equivalencias-legacy--nestjs)
12. [Historial de fixes técnicos](#12-historial-de-fixes-técnicos)
13. [Guías de cambios frecuentes](#13-guías-de-cambios-frecuentes)
14. [Pendiente — Rutas a migrar](#14-pendiente--rutas-a-migrar)

---

## 1. Contexto y decisiones de arquitectura

### Origen (Legacy)
- **Framework:** Express.js puro (`express@5`)
- **Base de datos:** MySQL 8 con driver `mysql2`
- **ORM:** Queries SQL crudas con pool de conexiones
- **Estructura:** Monolítico, una sola empresa

### Destino (NestJS)
- **Framework:** NestJS con arquitectura modular
- **Base de datos:** PostgreSQL
- **ORM:** Prisma 7+
- **Estructura:** Multi-tenant, múltiples empresas con suscripciones

### Estrategia de tenancy elegida: **Row-level (shared schema)**

Se descartó schema-per-tenant porque el volumen de empresas no lo justifica y añade complejidad operativa. Todas las tablas tenant-scoped llevan `empresa_id` y **todos** los queries filtran por ese campo, extraído automáticamente del JWT.

```
Un JWT → contiene empresa_id → middleware lo inyecta en el request
→ cada service usa ese empresa_id en TODOS sus queries → aislamiento garantizado
```

### Estrategia de migración de datos
La empresa existente en el legacy pasa a ser `empresa_id = 1`. La migración se realiza al final, cuando el nuevo backend esté completamente funcional, usando **pgloader** para transferir de MySQL a PostgreSQL.

### Decisión descartada — Prisma Extensions para multi-tenant
Se evaluó usar `Prisma Client Extensions` con `Scope.REQUEST` para inyectar `empresa_id` automáticamente en cada query. Se descartó porque:
- `Scope.REQUEST` crea una nueva instancia de `PrismaClient` por cada request — costoso con carga alta
- Los modelos de catálogo global no tienen `empresa_id` — la extensión `$allModels` les inyectaría el filtro y fallaría
- Más difícil de debuggear que pasar `empresa_id` explícitamente

**Decisión final:** `PrismaService` singleton, `empresa_id` explícito en cada service tenant-scoped via decorador `@Tenant()`.

---

## 2. Stack tecnológico

| Categoría | Legacy | NestJS |
|---|---|---|
| Framework | Express 5 | NestJS 11+ |
| Base de datos | MySQL 8 | PostgreSQL 16 |
| ORM / Query | mysql2 pool crudo | Prisma 7+ |
| Driver PostgreSQL | — | `@prisma/adapter-pg` |
| Auth | jsonwebtoken manual | @nestjs/jwt + passport-jwt |
| Validación | Manual | class-validator + class-transformer |
| Documentación | Ninguna | Swagger (@nestjs/swagger) |
| Tareas programadas | node-cron | @nestjs/schedule |
| Variables de entorno | dotenv | @nestjs/config (ConfigModule global) |
| Logging | morgan | Logger nativo de NestJS |
| Upload de archivos | multer directo | FileInterceptor (multer incluido) |

### Dependencias instaladas

```bash
# Core NestJS + Prisma
npm install prisma @prisma/client
npm install @prisma/adapter-pg pg
npm install @nestjs/config class-validator class-transformer
npm install @nestjs/swagger

# Auth
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt

# Tareas programadas
npm install @nestjs/schedule

# SRI / Facturación electrónica
npm install ec-sri-invoice-signer easy-soap-request xml-writer xml2js node-forge

# Archivos y PDFs
npm install pdfmake bwip-js streamifier
npm install -D @types/multer

# Utilidades
npm install moment cryptr googleapis gsmarena-api

# Dev — runner de TypeScript para seed y scripts
npm install -D tsx
```

---

## 3. Estructura del proyecto

```
backend-nestjs/
├── prisma/
│   ├── schema.prisma              ← Definición completa del modelo de datos
│   ├── seed.ts                    ← Seed de catálogos globales (idempotente)
│   └── migrations/                ← Historial de migraciones (generado por Prisma)
├── prisma.config.ts               ← Config de Prisma 7: URL, migraciones, seed
├── generated/
│   └── prisma/                    ← Cliente Prisma generado (npx prisma generate)
├── src/
│   ├── main.ts                    ← Bootstrap: HTTPS, CORS, ValidationPipe, Swagger
│   ├── app.module.ts              ← Módulo raíz
│   ├── bootstrap.service.ts       ← OnModuleInit: verifica token Google Drive
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts       ← @Global(), exporta PrismaService
│   │   └── prisma.service.ts      ← Extiende PrismaClient con adapter-pg
│   │
│   ├── google-drive/
│   │   ├── google-drive.module.ts
│   │   └── google-drive.service.ts
│   │
│   ├── brands/
│   │   ├── brands.module.ts
│   │   ├── brands.service.ts
│   │   ├── brands.controller.ts
│   │   └── brands-sync.service.ts  ← scanbrands() + @Cron medianoche Guayaquil
│   │
│   ├── auth/                       ← [PENDIENTE]
│   ├── usuarios/                   ← [PENDIENTE]
│   ├── empresas/                   ← [PENDIENTE]
│   ├── suscripciones/              ← [PENDIENTE]
│   ├── sucursales/                 ← [PENDIENTE]
│   ├── firmas/                     ← [PENDIENTE]
│   ├── clientes/                   ← [PENDIENTE]
│   ├── items/                      ← [PENDIENTE]
│   ├── models/                     ← [PENDIENTE]
│   ├── ventas/                     ← [PENDIENTE]
│   ├── facturas/                   ← [PENDIENTE]
│   ├── catalogos/                  ← [PENDIENTE]
│   └── common/                     ← [PENDIENTE]
│       ├── decorators/
│       │   ├── current-user.decorator.ts
│       │   └── tenant.decorator.ts
│       ├── guards/
│       │   ├── jwt-auth.guard.ts
│       │   ├── roles.guard.ts
│       │   └── subscription.guard.ts
│       └── middleware/
│           └── tenant.middleware.ts
│
├── .env.example
├── ARQUITECTURA.md                ← Este archivo
├── tsconfig.json
└── package.json
```

---

## 4. Configuración inicial — comandos

```bash
# 1. Crear el proyecto
npm i -g @nestjs/cli
nest new backend-nestjs --package-manager npm
cd backend-nestjs

# 2. Instalar dependencias (ver sección 2)

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con DATABASE_URL y demás valores

# 4. Generar el cliente Prisma
#    OBLIGATORIO antes de compilar — crea /generated/prisma con tipos TypeScript
npx prisma generate

# 5. Crear tablas en PostgreSQL
npx prisma migrate dev --name init

# 6. Poblar catálogos globales
npx prisma db seed

# 7. Desarrollo
npm run start:dev

# 8. Producción
npm run build
npm run start:prod
```

---

## 5. Variables de entorno

```env
# Base de datos
DATABASE_URL="postgresql://postgres:password@localhost:5432/inventarios_f"

# App
PORT=3950
NODE_ENV=development   # production | development

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_EXPIRES_IN=8h
JWT_REFRESH_SECRET=tu_refresh_secreto_aqui
JWT_REFRESH_EXPIRES_IN=7d

# Google Drive
GOOGLE_CREDENTIALS_PATH=src/google-drive/credentials.json
GOOGLE_TOKEN_PATH=src/google-drive/token.json

# Cryptr
CRYPTR_SECRET=tu_clave_cryptr_aqui

# SRI Ecuador
SRI_AMBIENTE=2   # 1 = pruebas | 2 = producción
```

---

## 6. Módulos del sistema

### Catálogos globales (sin empresa_id)

| Módulo | Descripción |
|---|---|
| `BrandsModule` | Marcas de dispositivos. Sync automático diario desde GSM Arena. |
| `ModelsModule` | Modelos de dispositivos por marca. |
| `CatalogosModule` | `forma_pago`, `tipo_comprobante`, `tipo_impuesto`, `tarifa_impuesto`, `estado_sri`, `estados_numeracion`, `tipo_identificacion_sri`, `regimenes` |

### Módulos de gestión (SUPERADMIN)

| Módulo | Descripción |
|---|---|
| `EmpresasModule` | CRUD de empresas. Solo SUPERADMIN. |
| `SuscripcionesModule` | Planes, asignación y control de vencimientos. |

### Módulos tenant-scoped (empresa_id en todos los queries)

| Módulo | Descripción |
|---|---|
| `ClientesModule` | Clientes por empresa. |
| `SucursalesModule` | Sucursales y puntos de emisión. |
| `FirmasModule` | Certificados digitales p12 por empresa. |
| `ItemsModule` | Productos/servicios con lotes de inventario. |
| `VentasModule` | Ventas con detalle. |
| `FacturasModule` | Facturación electrónica SRI (XML, firma, SOAP). |

### Módulos de infraestructura

| Módulo | Descripción |
|---|---|
| `AuthModule` | Login, JWT strategy, refresh token. |
| `UsuariosModule` | CRUD usuarios. Un usuario puede pertenecer a varias empresas. |
| `PrismaModule` | `@Global()` — singleton disponible en toda la app. |
| `GoogleDriveModule` | Verificación y renovación de tokens OAuth2. |

---

## 7. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"   // Cliente fuera de node_modules
}
```

El `output` personalizado evita conflictos de tipos con TypeScript.  
Import en el código: `import { PrismaClient } from '../../generated/prisma'`

### Clasificación de modelos

**Catálogos globales** (sin empresa_id):
`Plan`, `Regimen`, `Role`, `TipoIdentificacionSri`, `TipoImpuesto`, `TarifaImpuesto`, `TipoItem`, `FormaPago`, `TipoComprobante`, `EstadoSri`, `EstadoNumeracion`, `Brand`, `Model`

**Suscripciones:**
`Suscripcion` (1-to-1 con `Empresa`)

**Enum `EstadoSuscripcion`:** `ACTIVA | VENCIDA | SUSPENDIDA | CANCELADA | TRIAL`

**Tenant-scoped** (todos llevan `empresa_id`):
`Empresa`, `Sucursal`, `Firma`, `Cliente`, `Item`, `ItemLote`, `ItemModelo`, `Venta`, `DetalleVenta`, `FacturaNumeracion`, `Factura`

### Unique constraints multi-tenant

```prisma
// Cliente: identificación única POR empresa
@@unique([empresa_id, identificacion])

// Item: código único POR empresa
@@unique([empresa_id, item_codigo_principal])

// Venta: número único POR empresa
@@unique([empresa_id, numero_venta])

// Sucursal: código único POR empresa
@@unique([sucursales_empresaId, sucursales_cod])
```

---

## 8. Arquitectura multi-tenant

### Flujo de un request autenticado

```
Request HTTP
    │
    ▼
TenantMiddleware
    │  Decodifica JWT → extrae { userId, empresaId, rol }
    │  Inyecta en req.empresaId y req.user
    ▼
JwtAuthGuard        ← verifica firma del JWT
    ▼
SubscriptionGuard   ← opcional, verifica suscripción activa/trial
    ▼
RolesGuard          ← opcional, verifica rol en esa empresa
    ▼
Controller
    │  @Tenant() empresaId: number
    ▼
Service
    │  WHERE empresa_id = empresaId  ← en TODOS los queries
    ▼
PrismaService → PostgreSQL
```

### Payload del JWT

```typescript
interface JwtPayload {
  sub: number;        // usuarios_id
  username: string;
  empresaId: number;  // tenant activo
  rol: string;        // rol en esa empresa
  codEmi: string;     // código de emisión (sucursal)
}
```

### Roles del sistema

| Rol | Scope | Permisos |
|---|---|---|
| `SUPERADMIN` | Global | Gestiona empresas, planes, suscripciones. Sin `empresa_id` en JWT. |
| `ADMINISTRADOR` | Por empresa | Administra su empresa completa. |
| `FACTURADOR` | Por empresa | Solo puede crear ventas y consultar. |

---

## 9. Seeding — Catálogos globales

### Comando

```bash
npx prisma db seed
```

El seed está configurado en `prisma.config.ts`:

```typescript
migrations: {
  path: 'prisma/migrations',
  seed: 'tsx prisma/seed.ts',   // Prisma 7 — ya no va en package.json
},
```

### Características del seed

- **Idempotente** — usa `upsert` en todos los registros. Se puede correr N veces sin duplicar datos.
- **Sin datos de empresa** — solo catálogos globales. Las empresas se crean por API.
- **Orden de ejecución** — respeta dependencias FK: `TipoImpuesto` antes que `TarifaImpuesto`.

### Catálogos que puebla

| Catálogo | Registros | Fuente |
|---|---|---|
| `roles` | 3 | Legacy + `SUPERADMIN` nuevo |
| `regimenes` | 3 | Legacy (SRI Ecuador) |
| `tipo_identificacion_sri` | 5 | Legacy (SRI Ecuador) |
| `tipo_impuesto` | 3 | Legacy (IVA, ICE, IRBPNR) |
| `tarifa_impuesto` | 9 | Legacy (todas las tarifas IVA vigentes) |
| `forma_pago` | 8 | Legacy (códigos SRI Ecuador) |
| `tipo_comprobante` | 7 | Legacy (comprobantes SRI Ecuador) |
| `estado_sri` | 7 | Legacy (ciclo de vida factura electrónica) |
| `estados_numeracion` | 3 | Legacy (LIBRE, OCUPADO, USADO) |
| `tipo_item` | 2 | Legacy (Producto, Servicio) |
| `planes` | 2 | Nuevo (TRIAL, OWNED) |

### Configuración técnica del seed (Prisma 7)

```typescript
// prisma/seed.ts
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

**Por qué `{ connectionString }` y no `connectionString` directo:**
`PrismaPg` espera un `PoolConfig` (objeto) o una instancia de `Pool`, no un string. Pasar el string directo lanza error de tipos en TypeScript y error en runtime.

---

## 10. Archivos implementados — Fase 1

### `src/main.ts`
Bootstrap. HTTPS (Let's Encrypt en prod, localhost en dev), CORS con whitelist, `ValidationPipe` global, Swagger en `/api/docs` solo en desarrollo.

### `src/bootstrap.service.ts`
`OnModuleInit` — verifica y renueva token de Google Drive después de que el contenedor DI esté completamente listo. Reemplaza el `app.get()` post-`listen()` que causaba `UnknownElementException`.

### `src/app.module.ts`
`ConfigModule.forRoot({ isGlobal: true })` — hace `ConfigService` disponible en toda la app sin reimportar. `ScheduleModule.forRoot()` habilita `@Cron`.

### `src/prisma/prisma.service.ts`
Extiende `PrismaClient` con `PrismaPg` como driver adapter. `OnModuleInit` / `OnModuleDestroy` para conectar/desconectar con el ciclo de vida de NestJS.

### `src/google-drive/google-drive.service.ts`
Migración 1:1 de `checkToken.js`: `verifyToken()`, `refreshAccessToken()`, `getAuthClient()`.

### `src/brands/brands-sync.service.ts`
Migración 1:1 de `update_models_and_brands.js`: `scanbrands()` + `savemodels()` con `@Cron('0 0 * * *', { timeZone: 'America/Guayaquil' })`.

---

## 11. Equivalencias Legacy → NestJS

| Legacy (Express) | NestJS | Archivo |
|---|---|---|
| `https.createServer(opts, app)` | `NestFactory.create(AppModule, { httpsOptions })` | `main.ts` |
| `app.use(morgan('dev'))` | Logger nativo de NestJS | `main.ts` |
| `app.use(cors({...}))` | `app.enableCors({...})` | `main.ts` |
| `cron.schedule('0 0 * * *', fn, { timezone })` | `@Cron('0 0 * * *', { timeZone })` | `brands-sync.service.ts` |
| `require('./utils/checkToken')` | `GoogleDriveService` | `google-drive/` |
| `require('./scraping/update_models_and_brands')` | `BrandsSyncService` | `brands/` |
| `require('./config/database')` (mysql2 pool) | `PrismaService` + `PrismaPg` | `prisma/` |
| `dbpool.query('SELECT ...')` | `prisma.model.findMany({ where })` | Servicios |
| `INSERT ... ON DUPLICATE KEY UPDATE` | `prisma.model.upsert()` | `brands-sync.service.ts` |
| `verifyToken()` en callback de `listen()` | `BootstrapService.onModuleInit()` | `bootstrap.service.ts` |
| `dotenv` + `process.env.X` | `ConfigService.get('X')` | Servicios |
| `app.use(require('./routes/X'))` | `@Controller('x')` + `@Module` | Feature modules |

---

## 12. Historial de fixes técnicos

### Fix 1 — Tipo HTTPS incorrecto
`https.ServerOptions` de Node.js ≠ tipo de NestJS.  
✅ Usar `HttpsOptions` de `@nestjs/common/interfaces/external/https-options.interface`

### Fix 2 — Import de PrismaClient en Prisma 7
Con `output` personalizado en schema, el import cambia.  
✅ `import { PrismaClient } from '../../generated/prisma'` (no `@prisma/client`)

### Fix 3 — app.get() post-listen() causa UnknownElementException
El contenedor DI no está resuelto en ese punto del bootstrap.  
✅ `BootstrapService` con `OnModuleInit` — Nest garantiza que todos los providers están listos

### Fix 4 — ConfigService no disponible en GoogleDriveModule
`UnknownDependenciesException` al inyectar ConfigService.  
✅ `ConfigModule.forRoot({ isGlobal: true })` en AppModule

### Fix 5 — gsmarena-api sin tipos TypeScript
`import * as gsmarena` genera error de tipos.  
✅ `const gsmarena = require('gsmarena-api')` con `// eslint-disable-next-line`

### Fix 6 — PrismaClient necesita opciones explícitas en Prisma 7
`new PrismaClient()` sin argumentos lanza `PrismaClientInitializationError`.  
✅ Instalar `@prisma/adapter-pg` y pasar el adapter al constructor

### Fix 7 — Conflicto de versiones @types/pg
`Pool` de `pg` es incompatible con el `Pool` interno de `@prisma/adapter-pg`.  
✅ No importar `Pool` de `pg`. Usar `PrismaPg({ connectionString })` directamente

### Fix 8 — PrismaPg no acepta string directo
`new PrismaPg(connectionString)` falla — espera `PoolConfig` (objeto).  
✅ `new PrismaPg({ connectionString })` — pasar objeto con la propiedad

### Fix 9 — findUnique retorna null (error de tipos)
TypeScript señala posible null al usar el resultado de `findUnique` como FK.  
✅ `findUniqueOrThrow` — garantiza que no es null, lanza error claro si no existe

---

## 13. Guías de cambios frecuentes

### Agregar un nuevo plan

Los planes son datos de catálogo — se gestionan únicamente a través del seed, no por API.

**Paso 1 — Agregar el plan en `prisma/seed.ts`**

```typescript
// En el array `planes` dentro de main()
{
  plan_nombre:      'BÁSICO',
  plan_descripcion: 'Plan básico para pequeños negocios',
  plan_precio:      29.99,
  plan_moneda:      'USD',
  max_usuarios:     2,
  max_sucursales:   1,
  max_facturas_mes: 200,
  max_items:        500,
  plan_activo:      true,
  plan_visible:     true,   // aparece en listados públicos
},
```

**Paso 2 — Correr el seed**

```bash
npx prisma db seed
```

El seed es idempotente — los planes existentes (TRIAL, OWNED) no se tocan. Solo se inserta el nuevo.

**Eso es todo.** No hay migración de schema porque la tabla `planes` ya existe.

---

### Agregar un nuevo catálogo global (nueva tabla)

Ejemplo: agregar una tabla `monedas`.

**Paso 1 — Agregar el modelo en `prisma/schema.prisma`**

```prisma
model Moneda {
  moneda_id     Int    @id @default(autoincrement())
  codigo        String @unique @db.VarChar(3)
  nombre        String @db.VarChar(50)
  simbolo       String @db.VarChar(5)

  @@map("monedas")
}
```

**Paso 2 — Crear la migración**

```bash
npx prisma migrate dev --name add_monedas
```

Esto crea la tabla en la DB y genera el archivo en `prisma/migrations/`.

**Paso 3 — Regenerar el cliente Prisma**

```bash
npx prisma generate
```

Ahora `prisma.moneda` está disponible en el código TypeScript.

**Paso 4 — Agregar los datos al seed**

```typescript
// En prisma/seed.ts, dentro de main()
console.log('💱 Monedas...');
const monedas = [
  { codigo: 'USD', nombre: 'Dólar Estadounidense', simbolo: '$' },
  { codigo: 'EUR', nombre: 'Euro', simbolo: '€' },
];

for (const moneda of monedas) {
  await prisma.moneda.upsert({
    where: { codigo: moneda.codigo },
    update: { nombre: moneda.nombre, simbolo: moneda.simbolo },
    create: moneda,
  });
}
console.log(`   ✅ ${monedas.length} monedas`);
```

**Paso 5 — Correr el seed**

```bash
npx prisma db seed
```

---

### Agregar un campo a una tabla existente

Ejemplo: agregar `plan_max_almacenamiento_mb` a `Plan`.

**Paso 1 — Editar `prisma/schema.prisma`**

```prisma
model Plan {
  // ... campos existentes ...
  plan_max_almacenamiento_mb Int @default(500)   // ← nuevo campo
}
```

**Paso 2 — Crear la migración**

```bash
npx prisma migrate dev --name add_almacenamiento_to_plan
```

**Paso 3 — Regenerar el cliente**

```bash
npx prisma generate
```

**Paso 4 — Actualizar el seed** para que el `update` del upsert incluya el nuevo campo si corresponde.

**Paso 5 — Correr el seed**

```bash
npx prisma db seed
```

---

### Actualizar un valor de catálogo existente

Ejemplo: cambiar el límite de facturas del plan TRIAL de 30 a 50.

Solo editar el array en `prisma/seed.ts`:

```typescript
{
  plan_nombre:      'TRIAL',
  max_facturas_mes: 50,   // ← cambiar el valor
  // ... resto igual
}
```

Y correr:

```bash
npx prisma db seed
```

El `upsert` actualiza el registro existente. No hay migración porque no cambió el schema.

---

## 14. Pendiente — Rutas a migrar

| Archivo legacy | Módulo NestJS destino | Estado |
|---|---|---|
| `src/routes/index.js` | `AuthModule`, `UsuariosModule` | ⏳ Siguiente |
| `src/routes/products.js` | `ItemsModule`, `BrandsModule`, `ModelsModule` | ⏳ Pendiente |
| `src/routes/clients.js` | `ClientesModule` | ⏳ Pendiente |
| `src/routes/sales.js` | `VentasModule` | ⏳ Pendiente |
| `src/routes/signature.js` | `FirmasModule` | ⏳ Pendiente |
| `src/routes/invoices.js` | `FacturasModule` | ⏳ Pendiente |

### Proceso de migración por ruta
1. Recibir el archivo legacy con middlewares, controlador y modelo
2. Identificar entidades, queries y lógica de negocio
3. Crear DTOs de validación
4. Implementar Service con Prisma (añadiendo `empresa_id` en queries tenant-scoped)
5. Implementar Controller con guards apropiados
6. Registrar en el Module correspondiente

---

*Fase completada: arranque del servidor + seed de catálogos funcionales.*  
*Próximo paso: migración de rutas comenzando por `AuthModule`.*

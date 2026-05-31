# BASE_DE_DATOS.md — Documentación de la Base de Datos

> **Motor:** PostgreSQL 16  
> **ORM:** Prisma 7+  
> **Proyecto:** TeamCellMania — Inventario y Facturación Electrónica (SRI Ecuador)  
> **Arquitectura:** Multi-tenant · Row-level tenancy

---

## Índice

1. [Visión general](#1-visión-general)
2. [Clasificación de tablas](#2-clasificación-de-tablas)
3. [Diagrama de relaciones](#3-diagrama-de-relaciones)
4. [Tablas de catálogo global](#4-tablas-de-catálogo-global)
5. [Tablas de suscripciones y planes](#5-tablas-de-suscripciones-y-planes)
6. [Tablas tenant-scoped](#6-tablas-tenant-scoped)
7. [Flujo de campos adicionales en una venta](#7-flujo-de-campos-adicionales-en-una-venta)
8. [Tablas pivot y auxiliares](#8-tablas-pivot-y-auxiliares)
9. [Enum](#9-enum)
10. [Reglas de integridad multi-tenant](#10-reglas-de-integridad-multi-tenant)
11. [Datos iniciales — Seed](#11-datos-iniciales--seed)
12. [Convenciones de nomenclatura](#12-convenciones-de-nomenclatura)
13. [Comandos de referencia](#13-comandos-de-referencia)

---

## 1. Visión general

La base de datos está organizada en tres capas:

```
┌─────────────────────────────────────────────────────────┐
│  CATÁLOGOS GLOBALES                                     │
│  Compartidos entre todos los tenants.                   │
│  No tienen empresa_id.                                  │
│  Solo se modifican via seed o migraciones.              │
│                                                         │
│  planes · regimenes · roles · tipo_identificacion_sri   │
│  tipo_impuesto · tarifa_impuesto · tipo_item            │
│  forma_pago · tipo_comprobante · estado_sri             │
│  estados_numeracion · brands · models                   │
├─────────────────────────────────────────────────────────┤
│  SUSCRIPCIONES                                          │
│  Relaciona cada empresa con su plan activo.             │
│                                                         │
│  suscripciones (1-to-1 con empresas)                    │
├─────────────────────────────────────────────────────────┤
│  TENANT-SCOPED                                          │
│  Cada fila pertenece a una empresa.                     │
│  SIEMPRE se filtra por empresa_id en queries.           │
│                                                         │
│  empresas · usuarios · usuario_empresa                  │
│  sucursales · firmas · clientes                         │
│  items · item_lotes · item_modelo                       │
│  ventas · detalle_venta                                 │
│  facturas · facturas_numeracion                         │
└─────────────────────────────────────────────────────────┘
```

**Total de tablas:** 29  
**Enums:** 1 (`EstadoSuscripcion`)

---

## 2. Clasificación de tablas

| Tabla | Tipo | Tiene empresa_id | Poblada por |
|---|---|---|---|
| `planes` | Catálogo global | No | Seed |
| `regimenes` | Catálogo global | No | Seed |
| `roles` | Catálogo global | No | Seed |
| `tipo_identificacion_sri` | Catálogo global | No | Seed |
| `tipo_impuesto` | Catálogo global | No | Seed |
| `tarifa_impuesto` | Catálogo global | No | Seed |
| `tipo_item` | Catálogo global | No | Seed |
| `forma_pago` | Catálogo global | No | Seed |
| `tipo_comprobante` | Catálogo global | No | Seed |
| `estado_sri` | Catálogo global | No | Seed |
| `estados_numeracion` | Catálogo global | No | Seed |
| `brands` | Catálogo global | No | Cron diario (GSM Arena) |
| `models` | Catálogo global | No | Cron diario (GSM Arena) |
| `suscripciones` | Suscripción | No (FK empresa) | API |
| `empresas` | Tenant raíz | Es el tenant | API (SUPERADMIN) |
| `usuarios` | Global con acceso tenant | No | API |
| `usuario_empresa` | Pivot | Indirecto via empresa | API |
| `sucursales` | Tenant-scoped | Sí | API |
| `firmas` | Tenant-scoped | Sí | API |
| `clientes` | Tenant-scoped | Sí | API |
| `items` | Tenant-scoped | Sí | API |
| `item_lotes` | Tenant-scoped | Indirecto via item | API |
| `item_modelo` | Pivot | Indirecto via item | API |
| `cliente_campos_adicionales` | Tenant-scoped | Sí | API |
| `ventas` | Tenant-scoped | Sí | API |
| `detalle_venta` | Tenant-scoped | Indirecto via venta | API |
| `facturas_numeracion` | Tenant-scoped | Indirecto via sucursal | API |
| `venta_campos_adicionales` | Tenant-scoped | Indirecto via venta | API |
| `facturas` | Tenant-scoped | Indirecto via venta | API |

---

## 3. Diagrama de relaciones

```
planes ──────────────────────────────────── suscripciones
                                                  │ 1-to-1
regimenes ──────────────── empresas ──────────────┘
                              │ 1-to-many
                    ┌─────────┼──────────────────────────┐
                    │         │                          │
               sucursales   firmas               usuario_empresa
                    │                             │          │
          facturas_numeracion               usuarios        roles
                    │
               ventas ────── clientes ── tipo_identificacion_sri
                │                  │
          venta_campos_adicionales  cliente_campos_adicionales
                │ │ │ │
                │ │ │ └── tipo_comprobante
                │ │ └──── forma_pago
                │ └────── usuarios (vendedor)
                │
          detalle_venta ──── item_lotes ──── items ──── tipo_item
                │                               │       tarifa_impuesto
                └── tarifa_impuesto             │           │
                                           item_modelo    tipo_impuesto
                                                │
                                             models ──── brands
                │
              facturas ──── estado_sri
                        └── usuarios (emisor)

tarifa_impuesto ←── tipo_impuesto
estados_numeracion ←── facturas_numeracion
```

---

## 4. Tablas de catálogo global

### `planes`
Planes de suscripción disponibles en el sistema.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `plan_id` | INT | PK, autoincrement | |
| `plan_nombre` | VARCHAR(50) | UNIQUE, NOT NULL | Ej: TRIAL, OWNED |
| `plan_descripcion` | VARCHAR(255) | nullable | |
| `plan_precio` | DECIMAL(10,2) | NOT NULL | Precio mensual en USD |
| `plan_moneda` | VARCHAR(3) | default 'USD' | |
| `max_usuarios` | INT | default 1 | `-1` = sin límite |
| `max_sucursales` | INT | default 1 | `-1` = sin límite |
| `max_facturas_mes` | INT | default 100 | `-1` = sin límite |
| `max_items` | INT | default 500 | `-1` = sin límite |
| `plan_activo` | BOOLEAN | default true | |
| `plan_visible` | BOOLEAN | default true | `false` = oculto al público |
| `plan_creadoEn` | TIMESTAMP | default now() | |

**Datos iniciales:**

| nombre | precio | usuarios | sucursales | facturas/mes | items | visible |
|---|---|---|---|---|---|---|
| TRIAL | 0.00 | 1 | 1 | 30 | 50 | ✅ |
| OWNED | 0.00 | -1 | -1 | -1 | -1 | ❌ |

---

### `regimenes`
Regímenes tributarios del SRI Ecuador para empresas.

| Campo | Tipo | Restricción |
|---|---|---|
| `regimenes_id` | INT | PK, autoincrement |
| `regimenes_nombre` | VARCHAR(100) | UNIQUE, NOT NULL |

**Datos iniciales:**

| id | nombre |
|---|---|
| 1 | NO |
| 2 | CONTRIBUYENTE RÉGIMEN RIMPE |
| 3 | CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE |

---

### `roles`
Roles de usuario dentro del sistema.

| Campo | Tipo | Restricción |
|---|---|---|
| `rol_id` | INT | PK, autoincrement |
| `rol_nombre` | VARCHAR(50) | UNIQUE, NOT NULL |
| `rol_descripcion` | VARCHAR(255) | nullable |

**Datos iniciales:**

| id | nombre | scope | descripción |
|---|---|---|---|
| 1 | SUPERADMIN | Global | Gestiona empresas, planes y suscripciones |
| 2 | ADMINISTRADOR | Por empresa | Permisos completos sobre la empresa |
| 3 | FACTURADOR | Por empresa | Solo puede facturar |

> `SUPERADMIN` no tiene `empresa_id` en su JWT. Los otros dos sí.

---

### `tipo_identificacion_sri`
Tipos de identificación según el SRI Ecuador. La PK es el código directamente.

| Campo | Tipo | Restricción |
|---|---|---|
| `codigo` | CHAR(2) | PK |
| `descripcion` | VARCHAR(50) | NOT NULL |

**Datos iniciales:**

| código | descripción |
|---|---|
| 04 | RUC |
| 05 | Cédula |
| 06 | Pasaporte |
| 07 | Consumidor Final |
| 08 | Identificación del Exterior |

---

### `tipo_impuesto`
Tipos de impuesto según el SRI Ecuador.

| Campo | Tipo | Restricción |
|---|---|---|
| `tipo_impuesto_id` | INT | PK, autoincrement |
| `tipo_impuesto_codigo_sri` | VARCHAR(2) | UNIQUE, NOT NULL |
| `tipo_impuesto_nombre` | VARCHAR(50) | NOT NULL |
| `tipo_impuesto_descripcion` | VARCHAR(255) | nullable |

**Datos iniciales:**

| id | código SRI | nombre | descripción |
|---|---|---|---|
| 1 | 2 | IVA | Impuesto al Valor Agregado |
| 2 | 3 | ICE | Impuesto a los Consumos Especiales |
| 3 | 5 | IRBPNR | Impuesto a los Ingresos de los No Residentes |

---

### `tarifa_impuesto`
Tarifas específicas de cada tipo de impuesto. Actualmente solo hay tarifas para IVA.

| Campo | Tipo | Restricción |
|---|---|---|
| `tarifa_impuesto_id` | INT | PK, autoincrement |
| `tipo_impuesto_id` | INT | FK → tipo_impuesto, NOT NULL |
| `tarifa_codigo_sri` | VARCHAR(2) | NOT NULL |
| `tarifa_porcentaje` | DECIMAL(5,2) | NOT NULL |
| `tarifa_nombre` | VARCHAR(50) | NOT NULL |
| `tarifa_descripcion` | VARCHAR(100) | NOT NULL |
| `tarifa_fecha_inicio` | DATE | NOT NULL |
| `tarifa_fecha_fin` | DATE | nullable |

**Unique compuesto:** `(tipo_impuesto_id, tarifa_codigo_sri)`

**Datos iniciales — Tarifas IVA (tipo_impuesto_id = 1):**

| id | código SRI | porcentaje | nombre | vigente desde |
|---|---|---|---|---|
| 1 | 0 | 0.00% | 0% | 2025-07-25 |
| 2 | 2 | 12.00% | 12% | 2025-07-25 |
| 3 | 3 | 14.00% | 14% | 2025-07-25 |
| 4 | 4 | 15.00% | 15% | 2025-07-25 |
| 5 | 5 | 5.00% | 5% | 2025-07-25 |
| 6 | 6 | 0.00% | No Objeto | 2025-07-25 |
| 7 | 7 | 0.00% | Exento | 2025-07-25 |
| 8 | 8 | 0.00% | Diferenciado | 2025-07-25 |
| 9 | 10 | 13.00% | 13% | 2025-07-25 |

---

### `tipo_item`
Clasificación de los productos/servicios del inventario.

| Campo | Tipo | Restricción |
|---|---|---|
| `tipo_item_id` | INT | PK, autoincrement |
| `tipo_item_nombre` | VARCHAR(50) | UNIQUE, NOT NULL |
| `tipo_item_descripcion` | VARCHAR(255) | nullable |

**Datos iniciales:**

| id | nombre | descripción |
|---|---|---|
| 1 | Producto | Ítems físicos con inventario |
| 2 | Servicio | Servicios que no manejan inventario |

---

### `forma_pago`
Formas de pago según el SRI Ecuador.

| Campo | Tipo | Restricción |
|---|---|---|
| `forma_pago_id` | INT | PK, autoincrement |
| `nombre` | VARCHAR(100) | NOT NULL |
| `codigo` | VARCHAR(2) | UNIQUE, NOT NULL |

**Datos iniciales:**

| id | código | nombre |
|---|---|---|
| 1 | 01 | SIN UTILIZACIÓN DEL SISTEMA FINANCIERO |
| 2 | 15 | COMPENSACIÓN DE DEUDAS |
| 3 | 16 | TARJETA DE DÉBITO |
| 4 | 17 | DINERO ELECTRÓNICO |
| 5 | 18 | TARJETA PREPAGO |
| 6 | 19 | TARJETA DE CRÉDITO |
| 7 | 20 | OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO |
| 8 | 21 | ENDOSO DE TÍTULOS |

---

### `tipo_comprobante`
Tipos de comprobante electrónico según el SRI Ecuador.

| Campo | Tipo | Restricción |
|---|---|---|
| `tipo_comprobante_id` | INT | PK, autoincrement |
| `nombre` | VARCHAR(100) | NOT NULL |
| `codigo` | VARCHAR(2) | UNIQUE, NOT NULL |
| `abreviatura` | VARCHAR(45) | UNIQUE, NOT NULL |

**Datos iniciales:**

| id | código | abreviatura | nombre |
|---|---|---|---|
| 1 | 00 | COV | COMPROBANTE DE VENTA |
| 2 | 01 | FAC | FACTURA |
| 3 | 03 | LIC | LIQUIDACIÓN DE COMPRA DE BIENES Y PRESTACIÓN DE SERVICIOS |
| 4 | 04 | NOC | NOTA DE CRÉDITO |
| 5 | 05 | NOD | NOTA DE DÉBITO |
| 6 | 06 | GUR | GUÍA DE REMISIÓN |
| 7 | 07 | COR | COMPROBANTE DE RETENCIÓN |

---

### `estado_sri`
Estados del ciclo de vida de una factura electrónica ante el SRI.

| Campo | Tipo | Restricción |
|---|---|---|
| `estado_sri_id` | INT | PK, autoincrement |
| `codigo` | VARCHAR(20) | UNIQUE, NOT NULL |
| `descripcion` | VARCHAR(255) | NOT NULL |

**Datos iniciales y flujo:**

```
PENDIENTE → ENVIADA → RECIBIDA → AUTORIZADO ✅
                   ↘ DEVUELTA  (errores de estructura)
                   ↘ RECHAZADA (rechazo definitivo)
         ↘ ANULADA  (anulación interna antes de enviar)
```

| id | código | descripción |
|---|---|---|
| 1 | PENDIENTE | Factura generada pero aún no enviada al SRI |
| 2 | ENVIADA | Factura enviada al SRI, esperando validación |
| 3 | RECIBIDA | Comprobante recibido por el SRI |
| 4 | DEVUELTA | Factura devuelta por errores en estructura o validación |
| 5 | AUTORIZADO | Factura aprobada por el SRI |
| 6 | RECHAZADA | Factura rechazada definitivamente por el SRI |
| 7 | ANULADA | Factura anulada internamente por el emisor |

---

### `estados_numeracion`
Estados del ciclo de vida de un número de factura en la numeración.

| Campo | Tipo | Restricción |
|---|---|---|
| `estado_id` | SMALLINT | PK, autoincrement |
| `estado_nombre` | VARCHAR(20) | UNIQUE, NOT NULL |

**Datos iniciales y flujo:**

```
LIBRE → OCUPADO → USADO
```

| id | nombre | cuándo |
|---|---|---|
| 1 | LIBRE | Número disponible para asignar |
| 2 | OCUPADO | Número asignado a una factura en proceso |
| 3 | USADO | Número ya emitido y no reutilizable |

---

### `brands`
Marcas de dispositivos móviles. Poblada automáticamente por el cron de GSM Arena.

| Campo | Tipo | Restricción |
|---|---|---|
| `brands_id` | INT | PK, autoincrement |
| `brands_find_id` | VARCHAR(50) | UNIQUE, NOT NULL — ID de GSM Arena |
| `brands_name` | VARCHAR(255) | UNIQUE, NOT NULL — siempre en MAYÚSCULAS |
| `brands_devices_count` | INT | default 0 — cantidad de modelos |

---

### `models`
Modelos de dispositivos por marca. Poblada automáticamente por el cron de GSM Arena.

| Campo | Tipo | Restricción |
|---|---|---|
| `models_id` | INT | PK, autoincrement |
| `models_find_id` | VARCHAR(100) | UNIQUE, NOT NULL — ID de GSM Arena |
| `models_name` | VARCHAR(255) | NOT NULL — siempre en MAYÚSCULAS |
| `models_brands_id` | INT | FK → brands (CASCADE DELETE) |
| `models_img_url` | VARCHAR(500) | nullable |
| `models_description` | TEXT | nullable |

---

## 5. Tablas de suscripciones y planes

### `suscripciones`
Una suscripción por empresa (relación 1-to-1). Controla el acceso al sistema.

| Campo | Tipo | Restricción |
|---|---|---|
| `suscripcion_id` | INT | PK, autoincrement |
| `empresa_id` | INT | UNIQUE, FK → empresas |
| `plan_id` | INT | FK → planes |
| `estado` | ENUM | default TRIAL |
| `fecha_inicio` | DATE | NOT NULL |
| `fecha_vencimiento` | DATE | NOT NULL |
| `fecha_cancelacion` | DATE | nullable |
| `renovacion_automatica` | BOOLEAN | default true |
| `suscripcion_creadoEn` | TIMESTAMP | default now() |

**Lógica de acceso:** Una empresa puede operar si `estado IN (ACTIVA, TRIAL)` y `fecha_vencimiento >= hoy`. El `SubscriptionGuard` verifica esto en cada request.

---

## 6. Tablas tenant-scoped

Todas estas tablas tienen `empresa_id` como columna de aislamiento. **Todos los queries deben incluir `WHERE empresa_id = ?`.**

---

### `empresas`
El tenant raíz. Cada empresa es un cliente del sistema.

| Campo | Tipo | Restricción |
|---|---|---|
| `empresas_id` | INT | PK, autoincrement |
| `empresas_razonSocial` | VARCHAR(255) | NOT NULL |
| `empresas_nombreComercial` | VARCHAR(255) | nullable |
| `empresas_ruc` | CHAR(13) | UNIQUE, NOT NULL |
| `empresas_dirMatriz` | VARCHAR(255) | NOT NULL |
| `empresas_telefono` | VARCHAR(20) | nullable |
| `empresa_email` | VARCHAR(100) | UNIQUE, NOT NULL |
| `empresas_obligadocontabilidad` | BOOLEAN | default false |
| `empresas_regimenes_id` | INT | FK → regimenes, nullable |
| `empresas_agenteRetencion` | BOOLEAN | default false |
| `empresas_activa` | BOOLEAN | default true |
| `empresas_creadoEn` | TIMESTAMP | default now() |

---

### `usuarios`
Usuarios del sistema. Un usuario puede pertenecer a múltiples empresas con distintos roles (via `usuario_empresa`).

| Campo | Tipo | Restricción |
|---|---|---|
| `usuarios_id` | INT | PK, autoincrement |
| `usuarios_username` | VARCHAR(50) | UNIQUE, NOT NULL |
| `usuarios_nombre` | VARCHAR(100) | NOT NULL |
| `usuarios_email` | VARCHAR(100) | UNIQUE, NOT NULL |
| `usuarios_password` | VARCHAR(255) | NOT NULL — bcrypt hash |
| `usuarios_activo` | BOOLEAN | default false |
| `usuarios_creadoEn` | TIMESTAMP | default now() |

> `usuarios_activo = false` por defecto — requiere activación explícita.

---

### `sucursales`
Puntos de emisión y sucursales de cada empresa.

| Campo | Tipo | Restricción |
|---|---|---|
| `sucursales_id` | INT | PK, autoincrement |
| `sucursales_empresaId` | INT | FK → empresas |
| `sucursales_cod` | VARCHAR(20) | default '001' |
| `sucursales_nombre` | VARCHAR(100) | default 'MATRIZ' |
| `sucursales_direccion` | VARCHAR(255) | NOT NULL |
| `sucursales_telefono` | VARCHAR(20) | nullable |
| `sucursales_esMatriz` | BOOLEAN | default false |

**Unique compuesto:** `(sucursales_empresaId, sucursales_cod)` — el código es único por empresa.

---

### `firmas`
Certificados digitales p12 para firma electrónica de facturas del SRI.

| Campo | Tipo | Restricción |
|---|---|---|
| `firmas_id` | INT | PK, autoincrement |
| `firmas_empresaId` | INT | FK → empresas |
| `firmas_alias` | VARCHAR(100) | nullable |
| `firmas_rutaArchivo` | VARCHAR(255) | NOT NULL — ruta al archivo .p12 |
| `firmas_password` | VARCHAR(255) | NOT NULL — contraseña encriptada |
| `firmas_fechaEmision` | DATE | nullable |
| `firmas_fechaExpiracion` | DATE | nullable |
| `firmas_activa` | BOOLEAN | default true |
| `firmas_creadoEn` | TIMESTAMP | default now() |

---

### `clientes`
Clientes de cada empresa. La identificación es única por empresa, no globalmente.

| Campo | Tipo | Restricción |
|---|---|---|
| `id` | INT | PK, autoincrement |
| `empresa_id` | INT | FK → empresas |
| `identificacion` | VARCHAR(20) | NOT NULL |
| `tipo_identificacion` | CHAR(2) | FK → tipo_identificacion_sri |
| `razon_social` | VARCHAR(150) | NOT NULL |
| `direccion` | TEXT | nullable |
| `email` | VARCHAR(100) | nullable |
| `telefono` | VARCHAR(20) | nullable |
| `es_consumidor_final` | BOOLEAN | default false |

**Unique compuesto:** `(empresa_id, identificacion)` — el mismo RUC puede existir en distintas empresas.

---

### `cliente_campos_adicionales`
Campos predefinidos por cliente que actúan como plantilla para prellenar ventas. Cada empresa define libremente las claves que necesita.

| Campo | Tipo | Restricción |
|---|---|---|
| `id` | INT | PK, autoincrement |
| `empresa_id` | INT | FK → empresas — tenant directo |
| `cliente_id` | INT | FK → clientes (CASCADE DELETE) |
| `clave` | VARCHAR(100) | NOT NULL — ej: `lugar_entrega`, `contacto` |
| `valor` | VARCHAR(500) | NOT NULL |

**Unique compuesto:** `(cliente_id, clave)` — una clave no se repite para el mismo cliente.

> **Por qué tiene  si ya está implícito via ?**  
> Para poder hacer queries directos por empresa sin hacer JOIN con clientes. Ejemplo: listar todas las claves usadas por una empresa para sugerirlas en el formulario.

**Ejemplo de datos:**
```
cliente_id | empresa_id | clave              | valor
-----------+------------+--------------------+-------------------
1          | 1          | lugar_entrega      | Av. Principal 123
1          | 1          | contacto_entrega   | Juan Pérez
2          | 1          | lugar_entrega      | Cdla. Kennedy Norte
2          | 1          | referencia         | Frente al parque
```

---

### `venta_campos_adicionales`
Campos adicionales de una venta/factura específica. Se precargan desde `cliente_campos_adicionales` al crear la venta, pero pueden editarse o agregarse campos nuevos para esa factura puntual.

| Campo | Tipo | Restricción |
|---|---|---|
| `id` | INT | PK, autoincrement |
| `venta_id` | INT | FK → ventas (CASCADE DELETE) |
| `clave` | VARCHAR(100) | NOT NULL |
| `valor` | VARCHAR(500) | NOT NULL |

**Unique compuesto:** `(venta_id, clave)` — una clave no se repite en la misma venta.

> No tiene `empresa_id` propio porque ya está implícito via `venta_id → ventas.empresa_id`.

**Ejemplo de datos:**
```
venta_id | clave              | valor
---------+--------------------+----------------------------
45       | lugar_entrega      | Av. Principal 123   ← del predefinido
45       | contacto_entrega   | Juan Pérez          ← del predefinido
46       | lugar_entrega      | Sucursal Norte      ← editado para esta factura
46       | num_pedido         | PO-2026-0089        ← campo nuevo solo para esta venta
```

---

### `items`
Productos y servicios del inventario de cada empresa.

| Campo | Tipo | Restricción |
|---|---|---|
| `item_id` | INT | PK, autoincrement |
| `empresa_id` | INT | FK → empresas |
| `item_codigo_principal` | VARCHAR(25) | NOT NULL |
| `item_codigo_auxiliar` | VARCHAR(25) | nullable |
| `tipo_item_id` | INT | FK → tipo_item |
| `tarifa_impuesto_id` | INT | FK → tarifa_impuesto |
| `item_nombre` | VARCHAR(100) | NOT NULL — siempre en MAYÚSCULAS |
| `item_descripcion` | TEXT | nullable |
| `item_precio_unitario` | DECIMAL(12,2) | NOT NULL |
| `item_activo` | BOOLEAN | default true |
| `item_fecha_creacion` | DATETIME | default now() |
| `item_fecha_actualizacion` | DATETIME | nullable — auto @updatedAt |

**Unique compuesto:** `(empresa_id, item_codigo_principal)` — el código es único por empresa.

---

### `item_lotes`
Lotes de inventario por ítem. Controla el stock físico disponible.

| Campo | Tipo | Restricción |
|---|---|---|
| `lote_id` | INT | PK, autoincrement |
| `item_id` | INT | FK → items |
| `numero_lote` | VARCHAR(50) | NOT NULL |
| `cantidad` | INT | NOT NULL |
| `fecha_ingreso` | DATETIME | default now() |
| `observaciones` | TEXT | nullable |

> El `lote_id` es el que se referencia en `detalle_venta`, no el `item_id` directamente. Esto permite trazabilidad por lote.

---

### `ventas`
Cabecera de cada transacción de venta.

| Campo | Tipo | Restricción |
|---|---|---|
| `venta_id` | INT | PK, autoincrement |
| `empresa_id` | INT | FK → empresas |
| `cliente_id` | INT | FK → clientes |
| `fecha_emision` | TIMESTAMP | NOT NULL |
| `tipo_comprobante_id` | INT | FK → tipo_comprobante |
| `moneda` | VARCHAR(3) | default 'USD' |
| `forma_pago_id` | INT | FK → forma_pago |
| `plazo_pago` | VARCHAR(20) | nullable — ej: '30 días' |
| `observaciones` | TEXT | nullable |
| `subtotal` | DECIMAL(10,2) | NOT NULL |
| `descuento_total` | DECIMAL(10,2) | default 0.00 |
| `iva` | DECIMAL(10,2) | default 0.00 |
| `propina` | DECIMAL(10,2) | default 0.00 |
| `total` | DECIMAL(10,2) | NOT NULL |
| `fecha_creacion` | DATETIME | default now() |
| `numero_venta` | VARCHAR(45) | NOT NULL |
| `ventas_usuario_id` | INT | FK → usuarios, nullable |
| `ventas_sucursales_id` | INT | FK → sucursales, nullable |

**Unique compuesto:** `(empresa_id, numero_venta)` — el número es único por empresa.

---

### `detalle_venta`
Líneas de cada venta. Referencia lotes (no items directamente) para trazabilidad de inventario.

| Campo | Tipo | Restricción |
|---|---|---|
| `detalle_id` | INT | PK, autoincrement |
| `venta_id` | INT | FK → ventas |
| `lote_id` | INT | FK → item_lotes |
| `cantidad` | INT | NOT NULL |
| `precio_unitario` | DECIMAL(10,2) | NOT NULL |
| `descuento` | DECIMAL(10,2) | default 0.00 |
| `tarifa_impuesto_id` | INT | FK → tarifa_impuesto |

---

### `facturas_numeracion`
Pool de números de factura por sucursal. Controla qué números están libres, ocupados o usados.

| Campo | Tipo | Restricción |
|---|---|---|
| `numeracion_id` | BIGINT | PK, autoincrement |
| `sucursal_id` | INT | FK → sucursales |
| `numero` | INT | NOT NULL |
| `estado_id` | SMALLINT | FK → estados_numeracion |
| `fecha_generacion` | TIMESTAMP | default now() |

**Unique compuesto:** `(sucursal_id, numero)` — el número es único por sucursal.

---

### `facturas`
Datos de la factura electrónica enviada al SRI. Relación 1-to-1 con `ventas`.

| Campo | Tipo | Restricción |
|---|---|---|
| `factura_id` | INT | PK, autoincrement |
| `venta_id` | INT | UNIQUE, FK → ventas — 1 factura por venta |
| `clave_acceso` | VARCHAR(49) | UNIQUE, NOT NULL — generada por SRI |
| `estado_sri_id` | INT | FK → estado_sri, nullable |
| `mensaje_sri` | TEXT | nullable — respuesta/error del SRI |
| `fecha_envio_sri` | DATETIME | nullable |
| `fecha_autorizacion` | DATETIME | nullable |
| `id_xml` | TEXT | nullable — ruta o referencia al XML |
| `ambiente` | SMALLINT | default 2 — `1`=pruebas, `2`=producción |
| `usuario_emisor_id` | INT | FK → usuarios |
| `fecha_creacion` | TIMESTAMP | default now() |

---

## 7. Flujo de campos adicionales en una venta

```
1. Usuario selecciona cliente en el formulario de venta
         ↓
2. Frontend consulta cliente_campos_adicionales WHERE cliente_id = X
         ↓
3. Se precargan como sugerencia en el formulario
   (ej: lugar_entrega = "Av. Principal 123")
         ↓
4. Usuario confirma, edita valores o agrega nuevos campos
         ↓
5. Al guardar la venta → se crean registros en venta_campos_adicionales
         ↓
6. Al generar el PDF/XML de la factura → se incluyen esos campos
```

---

## 8. Tablas pivot y auxiliares

### `usuario_empresa`
Relaciona usuarios con empresas y les asigna un rol. Un usuario puede tener distintos roles en distintas empresas.

| Campo | Tipo | Restricción |
|---|---|---|
| `usuario_empresa_id` | INT | PK, autoincrement |
| `usuario_empresa_usuarioId` | INT | FK → usuarios |
| `usuario_empresa_empresaId` | INT | FK → empresas |
| `usuario_empresa_codEmi` | VARCHAR(20) | default '001' — código emisor |
| `usuario_empresa_rolId` | INT | FK → roles |
| `fecha_asignacion` | TIMESTAMP | default now() |

**Unique compuesto:** `(usuario_empresa_usuarioId, usuario_empresa_empresaId)` — un usuario tiene un solo rol por empresa.

---

### `item_modelo`
Relaciona items del inventario con modelos de dispositivos compatibles.

| Campo | Tipo | Restricción |
|---|---|---|
| `item_modelo_id` | INT | PK, autoincrement |
| `item_id` | INT | FK → items (CASCADE DELETE) |
| `models_id` | INT | FK → models (CASCADE DELETE) |
| `compatibilidad_notas` | VARCHAR(255) | nullable |

**Unique compuesto:** `(item_id, models_id)` — un item no puede tener el mismo modelo dos veces.

---

## 9. Enum

### `EstadoSuscripcion`
Estado actual de la suscripción de una empresa.

| Valor | Significado |
|---|---|
| `TRIAL` | Período de prueba (estado inicial) |
| `ACTIVA` | Suscripción vigente y paga |
| `VENCIDA` | Venció sin renovación — acceso suspendido |
| `SUSPENDIDA` | Suspendida administrativamente |
| `CANCELADA` | Cancelada definitivamente |

**Estados que permiten operar:** `TRIAL` y `ACTIVA`.

---

## 10. Reglas de integridad multi-tenant

### Regla 1 — Nunca consultar sin empresa_id
Todos los queries sobre tablas tenant-scoped deben filtrar por `empresa_id`:

```typescript
// ✅ Correcto
prisma.cliente.findMany({ where: { empresa_id: empresaId } })

// ❌ Nunca hacer esto — devuelve datos de todos los tenants
prisma.cliente.findMany()
```

### Regla 2 — Unique constraints son por empresa, no globales

| Tabla | Campo | Constraint |
|---|---|---|
| `clientes` | `identificacion` | Único por `empresa_id` |
| `items` | `item_codigo_principal` | Único por `empresa_id` |
| `ventas` | `numero_venta` | Único por `empresa_id` |
| `sucursales` | `sucursales_cod` | Único por `sucursales_empresaId` |

Esto significa que el mismo RUC de cliente puede existir en dos empresas distintas sin conflicto.

### Regla 3 — Tablas de catálogo son de solo lectura en runtime
`forma_pago`, `tipo_comprobante`, `tarifa_impuesto`, etc. solo se modifican via seed o migración, nunca por API de usuario.

### Regla 4 — Cascade deletes están definidos explícitamente
- `brands → models`: CASCADE (si se borra una marca, se borran sus modelos)
- `items → item_modelo`: CASCADE (si se borra un item, se borran sus compatibilidades)
- `models → item_modelo`: CASCADE (si se borra un modelo del catálogo, se borran las relaciones)
- `clientes → cliente_campos_adicionales`: CASCADE (si se borra un cliente, se borran sus campos predefinidos)
- `ventas → venta_campos_adicionales`: CASCADE (si se borra una venta, se borran sus campos adicionales)

---

## 11. Datos iniciales — Seed

El seed está en `prisma/seed.ts` y se ejecuta con:

```bash
npx prisma db seed
```

**Características:**
- Completamente idempotente — usa `upsert` en todos los registros
- Respeta el orden de dependencias FK (ej: `tipo_impuesto` antes que `tarifa_impuesto`)
- Solo puebla catálogos globales — ningún dato de empresa

**Orden de ejecución en el seed:**

```
1. roles
2. regimenes
3. tipo_identificacion_sri
4. tipo_impuesto           ← debe existir antes que tarifa_impuesto
5. tarifa_impuesto         ← depende de tipo_impuesto
6. forma_pago
7. tipo_comprobante
8. estado_sri
9. estados_numeracion
10. tipo_item
11. planes
```

---

## 12. Convenciones de nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Nombres de tabla | snake_case, plural | `item_lotes`, `detalle_venta` |
| PKs | `tabla_id` | `venta_id`, `cliente_id` |
| FKs | `tabla_referenciada_id` | `empresa_id`, `tipo_item_id` |
| Booleans | prefijo `es_` o nombre descriptivo | `es_consumidor_final`, `plan_activo` |
| Timestamps de creación | `_creadoEn` o `_fecha_creacion` | `empresas_creadoEn` |
| Campos en MAYÚSCULAS | nombres de marcas, modelos e items | Forzado por trigger/aplicación |
| Modelo Prisma | PascalSingular | `TarifaImpuesto`, `ItemLote` |
| Tabla PostgreSQL | snake_case según `@@map` | `tarifa_impuesto`, `item_lotes` |

---

## 13. Comandos de referencia

```bash
# Generar cliente TypeScript desde el schema
npx prisma generate

# Crear nueva migración (después de cambiar schema.prisma)
npx prisma migrate dev --name descripcion_del_cambio

# Aplicar migraciones en producción (sin crear nuevas)
npx prisma migrate deploy

# Poblar catálogos globales
npx prisma db seed

# Ver la base de datos visualmente
npx prisma studio

# Ver el estado de las migraciones
npx prisma migrate status

# Resetear la DB completa (⚠️ BORRA TODOS LOS DATOS)
npx prisma migrate reset
```

-- CreateEnum
CREATE TYPE "EstadoSuscripcion" AS ENUM ('ACTIVA', 'VENCIDA', 'SUSPENDIDA', 'CANCELADA', 'TRIAL');

-- CreateTable
CREATE TABLE "planes" (
    "plan_id" SERIAL NOT NULL,
    "plan_nombre" VARCHAR(50) NOT NULL,
    "plan_descripcion" VARCHAR(255),
    "plan_precio" DECIMAL(10,2) NOT NULL,
    "plan_moneda" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "max_usuarios" INTEGER NOT NULL DEFAULT 1,
    "max_sucursales" INTEGER NOT NULL DEFAULT 1,
    "max_facturas_mes" INTEGER NOT NULL DEFAULT 100,
    "max_items" INTEGER NOT NULL DEFAULT 500,
    "plan_activo" BOOLEAN NOT NULL DEFAULT true,
    "plan_creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planes_pkey" PRIMARY KEY ("plan_id")
);

-- CreateTable
CREATE TABLE "suscripciones" (
    "suscripcion_id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'TRIAL',
    "fecha_inicio" DATE NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "fecha_cancelacion" DATE,
    "renovacion_automatica" BOOLEAN NOT NULL DEFAULT true,
    "suscripcion_creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("suscripcion_id")
);

-- CreateTable
CREATE TABLE "regimenes" (
    "regimenes_id" SERIAL NOT NULL,
    "regimenes_nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "regimenes_pkey" PRIMARY KEY ("regimenes_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "rol_id" SERIAL NOT NULL,
    "rol_nombre" VARCHAR(50) NOT NULL,
    "rol_descripcion" VARCHAR(255),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("rol_id")
);

-- CreateTable
CREATE TABLE "tipo_identificacion_sri" (
    "codigo" CHAR(2) NOT NULL,
    "descripcion" VARCHAR(50) NOT NULL,

    CONSTRAINT "tipo_identificacion_sri_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "tipo_impuesto" (
    "tipo_impuesto_id" SERIAL NOT NULL,
    "tipo_impuesto_codigo_sri" VARCHAR(2) NOT NULL,
    "tipo_impuesto_nombre" VARCHAR(50) NOT NULL,
    "tipo_impuesto_descripcion" VARCHAR(255),

    CONSTRAINT "tipo_impuesto_pkey" PRIMARY KEY ("tipo_impuesto_id")
);

-- CreateTable
CREATE TABLE "tarifa_impuesto" (
    "tarifa_impuesto_id" SERIAL NOT NULL,
    "tipo_impuesto_id" INTEGER NOT NULL,
    "tarifa_codigo_sri" VARCHAR(2) NOT NULL,
    "tarifa_porcentaje" DECIMAL(5,2) NOT NULL,
    "tarifa_nombre" VARCHAR(50) NOT NULL,
    "tarifa_descripcion" VARCHAR(100) NOT NULL,
    "tarifa_fecha_inicio" DATE NOT NULL,
    "tarifa_fecha_fin" DATE,

    CONSTRAINT "tarifa_impuesto_pkey" PRIMARY KEY ("tarifa_impuesto_id")
);

-- CreateTable
CREATE TABLE "tipo_item" (
    "tipo_item_id" SERIAL NOT NULL,
    "tipo_item_nombre" VARCHAR(50) NOT NULL,
    "tipo_item_descripcion" VARCHAR(255),

    CONSTRAINT "tipo_item_pkey" PRIMARY KEY ("tipo_item_id")
);

-- CreateTable
CREATE TABLE "forma_pago" (
    "forma_pago_id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "codigo" VARCHAR(2) NOT NULL,

    CONSTRAINT "forma_pago_pkey" PRIMARY KEY ("forma_pago_id")
);

-- CreateTable
CREATE TABLE "tipo_comprobante" (
    "tipo_comprobante_id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "codigo" VARCHAR(2) NOT NULL,
    "abreviatura" VARCHAR(45) NOT NULL,

    CONSTRAINT "tipo_comprobante_pkey" PRIMARY KEY ("tipo_comprobante_id")
);

-- CreateTable
CREATE TABLE "estado_sri" (
    "estado_sri_id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,

    CONSTRAINT "estado_sri_pkey" PRIMARY KEY ("estado_sri_id")
);

-- CreateTable
CREATE TABLE "estados_numeracion" (
    "estado_id" SMALLSERIAL NOT NULL,
    "estado_nombre" VARCHAR(20) NOT NULL,

    CONSTRAINT "estados_numeracion_pkey" PRIMARY KEY ("estado_id")
);

-- CreateTable
CREATE TABLE "brands" (
    "brands_id" SERIAL NOT NULL,
    "brands_find_id" VARCHAR(50) NOT NULL,
    "brands_name" VARCHAR(255) NOT NULL,
    "brands_devices_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("brands_id")
);

-- CreateTable
CREATE TABLE "models" (
    "models_id" SERIAL NOT NULL,
    "models_find_id" VARCHAR(100) NOT NULL,
    "models_name" VARCHAR(255) NOT NULL,
    "models_brands_id" INTEGER NOT NULL,
    "models_img_url" VARCHAR(500),
    "models_description" TEXT,

    CONSTRAINT "models_pkey" PRIMARY KEY ("models_id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "empresas_id" SERIAL NOT NULL,
    "empresas_razonSocial" VARCHAR(255) NOT NULL,
    "empresas_nombreComercial" VARCHAR(255),
    "empresas_ruc" CHAR(13) NOT NULL,
    "empresas_dirMatriz" VARCHAR(255) NOT NULL,
    "empresas_telefono" VARCHAR(20),
    "empresa_email" VARCHAR(100) NOT NULL,
    "empresas_obligadocontabilidad" BOOLEAN NOT NULL DEFAULT false,
    "empresas_regimenes_id" INTEGER,
    "empresas_agenteRetencion" BOOLEAN NOT NULL DEFAULT false,
    "empresas_activa" BOOLEAN NOT NULL DEFAULT true,
    "empresas_creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("empresas_id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "usuarios_id" SERIAL NOT NULL,
    "usuarios_username" VARCHAR(50) NOT NULL,
    "usuarios_nombre" VARCHAR(100) NOT NULL,
    "usuarios_email" VARCHAR(100) NOT NULL,
    "usuarios_password" VARCHAR(255) NOT NULL,
    "usuarios_activo" BOOLEAN NOT NULL DEFAULT false,
    "usuarios_creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("usuarios_id")
);

-- CreateTable
CREATE TABLE "usuario_empresa" (
    "usuario_empresa_id" SERIAL NOT NULL,
    "usuario_empresa_usuarioId" INTEGER NOT NULL,
    "usuario_empresa_empresaId" INTEGER NOT NULL,
    "usuario_empresa_codEmi" VARCHAR(20) NOT NULL DEFAULT '001',
    "usuario_empresa_rolId" INTEGER NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_empresa_pkey" PRIMARY KEY ("usuario_empresa_id")
);

-- CreateTable
CREATE TABLE "sucursales" (
    "sucursales_id" SERIAL NOT NULL,
    "sucursales_empresaId" INTEGER NOT NULL,
    "sucursales_cod" VARCHAR(20) NOT NULL DEFAULT '001',
    "sucursales_nombre" VARCHAR(100) NOT NULL DEFAULT 'MATRIZ',
    "sucursales_direccion" VARCHAR(255) NOT NULL,
    "sucursales_telefono" VARCHAR(20),
    "sucursales_esMatriz" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("sucursales_id")
);

-- CreateTable
CREATE TABLE "firmas" (
    "firmas_id" SERIAL NOT NULL,
    "firmas_empresaId" INTEGER NOT NULL,
    "firmas_alias" VARCHAR(100),
    "firmas_rutaArchivo" VARCHAR(255) NOT NULL,
    "firmas_password" VARCHAR(255) NOT NULL,
    "firmas_fechaEmision" DATE,
    "firmas_fechaExpiracion" DATE,
    "firmas_activa" BOOLEAN NOT NULL DEFAULT true,
    "firmas_creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "firmas_pkey" PRIMARY KEY ("firmas_id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "identificacion" VARCHAR(20) NOT NULL,
    "tipo_identificacion" CHAR(2) NOT NULL,
    "razon_social" VARCHAR(150) NOT NULL,
    "direccion" TEXT,
    "email" VARCHAR(100),
    "telefono" VARCHAR(20),
    "es_consumidor_final" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "item_id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "item_codigo_principal" VARCHAR(25) NOT NULL,
    "item_codigo_auxiliar" VARCHAR(25),
    "tipo_item_id" INTEGER NOT NULL,
    "tarifa_impuesto_id" INTEGER NOT NULL,
    "item_nombre" VARCHAR(100) NOT NULL,
    "item_descripcion" TEXT,
    "item_precio_unitario" DECIMAL(12,2) NOT NULL,
    "item_activo" BOOLEAN NOT NULL DEFAULT true,
    "item_fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "item_fecha_actualizacion" TIMESTAMP(3),

    CONSTRAINT "items_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "item_lotes" (
    "lote_id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "numero_lote" VARCHAR(50) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "item_lotes_pkey" PRIMARY KEY ("lote_id")
);

-- CreateTable
CREATE TABLE "item_modelo" (
    "item_modelo_id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "models_id" INTEGER NOT NULL,
    "compatibilidad_notas" VARCHAR(255),

    CONSTRAINT "item_modelo_pkey" PRIMARY KEY ("item_modelo_id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "venta_id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL,
    "tipo_comprobante_id" INTEGER NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "forma_pago_id" INTEGER NOT NULL,
    "plazo_pago" VARCHAR(20),
    "observaciones" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "descuento_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "iva" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "propina" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numero_venta" VARCHAR(45) NOT NULL,
    "ventas_usuario_id" INTEGER,
    "ventas_sucursales_id" INTEGER,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("venta_id")
);

-- CreateTable
CREATE TABLE "detalle_venta" (
    "detalle_id" SERIAL NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "lote_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tarifa_impuesto_id" INTEGER NOT NULL,

    CONSTRAINT "detalle_venta_pkey" PRIMARY KEY ("detalle_id")
);

-- CreateTable
CREATE TABLE "facturas_numeracion" (
    "numeracion_id" BIGSERIAL NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "estado_id" SMALLINT NOT NULL,
    "fecha_generacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facturas_numeracion_pkey" PRIMARY KEY ("numeracion_id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "factura_id" SERIAL NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "clave_acceso" VARCHAR(49) NOT NULL,
    "estado_sri_id" INTEGER,
    "mensaje_sri" TEXT,
    "fecha_envio_sri" TIMESTAMP(3),
    "fecha_autorizacion" TIMESTAMP(3),
    "id_xml" TEXT,
    "ambiente" SMALLINT DEFAULT 2,
    "usuario_emisor_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("factura_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "planes_plan_nombre_key" ON "planes"("plan_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "suscripciones_empresa_id_key" ON "suscripciones"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_rol_nombre_key" ON "roles"("rol_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_impuesto_tipo_impuesto_codigo_sri_key" ON "tipo_impuesto"("tipo_impuesto_codigo_sri");

-- CreateIndex
CREATE UNIQUE INDEX "tarifa_impuesto_tipo_impuesto_id_tarifa_codigo_sri_key" ON "tarifa_impuesto"("tipo_impuesto_id", "tarifa_codigo_sri");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_item_tipo_item_nombre_key" ON "tipo_item"("tipo_item_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "forma_pago_codigo_key" ON "forma_pago"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_comprobante_codigo_key" ON "tipo_comprobante"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_comprobante_abreviatura_key" ON "tipo_comprobante"("abreviatura");

-- CreateIndex
CREATE UNIQUE INDEX "estado_sri_codigo_key" ON "estado_sri"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "estados_numeracion_estado_nombre_key" ON "estados_numeracion"("estado_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "brands_brands_find_id_key" ON "brands"("brands_find_id");

-- CreateIndex
CREATE UNIQUE INDEX "brands_brands_name_key" ON "brands"("brands_name");

-- CreateIndex
CREATE UNIQUE INDEX "models_models_find_id_key" ON "models"("models_find_id");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_empresas_ruc_key" ON "empresas"("empresas_ruc");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_empresa_email_key" ON "empresas"("empresa_email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuarios_username_key" ON "usuarios"("usuarios_username");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuarios_email_key" ON "usuarios"("usuarios_email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_empresa_usuario_empresa_usuarioId_usuario_empresa_e_key" ON "usuario_empresa"("usuario_empresa_usuarioId", "usuario_empresa_empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "sucursales_sucursales_empresaId_sucursales_cod_key" ON "sucursales"("sucursales_empresaId", "sucursales_cod");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_empresa_id_identificacion_key" ON "clientes"("empresa_id", "identificacion");

-- CreateIndex
CREATE UNIQUE INDEX "items_empresa_id_item_codigo_principal_key" ON "items"("empresa_id", "item_codigo_principal");

-- CreateIndex
CREATE UNIQUE INDEX "item_modelo_item_id_models_id_key" ON "item_modelo"("item_id", "models_id");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_empresa_id_numero_venta_key" ON "ventas"("empresa_id", "numero_venta");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_numeracion_sucursal_id_numero_key" ON "facturas_numeracion"("sucursal_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_venta_id_key" ON "facturas"("venta_id");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_clave_acceso_key" ON "facturas"("clave_acceso");

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("empresas_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifa_impuesto" ADD CONSTRAINT "tarifa_impuesto_tipo_impuesto_id_fkey" FOREIGN KEY ("tipo_impuesto_id") REFERENCES "tipo_impuesto"("tipo_impuesto_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "models_models_brands_id_fkey" FOREIGN KEY ("models_brands_id") REFERENCES "brands"("brands_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_empresas_regimenes_id_fkey" FOREIGN KEY ("empresas_regimenes_id") REFERENCES "regimenes"("regimenes_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_empresa" ADD CONSTRAINT "usuario_empresa_usuario_empresa_usuarioId_fkey" FOREIGN KEY ("usuario_empresa_usuarioId") REFERENCES "usuarios"("usuarios_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_empresa" ADD CONSTRAINT "usuario_empresa_usuario_empresa_empresaId_fkey" FOREIGN KEY ("usuario_empresa_empresaId") REFERENCES "empresas"("empresas_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_empresa" ADD CONSTRAINT "usuario_empresa_usuario_empresa_rolId_fkey" FOREIGN KEY ("usuario_empresa_rolId") REFERENCES "roles"("rol_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_sucursales_empresaId_fkey" FOREIGN KEY ("sucursales_empresaId") REFERENCES "empresas"("empresas_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firmas" ADD CONSTRAINT "firmas_firmas_empresaId_fkey" FOREIGN KEY ("firmas_empresaId") REFERENCES "empresas"("empresas_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("empresas_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tipo_identificacion_fkey" FOREIGN KEY ("tipo_identificacion") REFERENCES "tipo_identificacion_sri"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("empresas_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_tipo_item_id_fkey" FOREIGN KEY ("tipo_item_id") REFERENCES "tipo_item"("tipo_item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_tarifa_impuesto_id_fkey" FOREIGN KEY ("tarifa_impuesto_id") REFERENCES "tarifa_impuesto"("tarifa_impuesto_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_lotes" ADD CONSTRAINT "item_lotes_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_modelo" ADD CONSTRAINT "item_modelo_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_modelo" ADD CONSTRAINT "item_modelo_models_id_fkey" FOREIGN KEY ("models_id") REFERENCES "models"("models_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("empresas_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_tipo_comprobante_id_fkey" FOREIGN KEY ("tipo_comprobante_id") REFERENCES "tipo_comprobante"("tipo_comprobante_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_forma_pago_id_fkey" FOREIGN KEY ("forma_pago_id") REFERENCES "forma_pago"("forma_pago_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_ventas_usuario_id_fkey" FOREIGN KEY ("ventas_usuario_id") REFERENCES "usuarios"("usuarios_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_ventas_sucursales_id_fkey" FOREIGN KEY ("ventas_sucursales_id") REFERENCES "sucursales"("sucursales_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("venta_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "item_lotes"("lote_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_tarifa_impuesto_id_fkey" FOREIGN KEY ("tarifa_impuesto_id") REFERENCES "tarifa_impuesto"("tarifa_impuesto_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_numeracion" ADD CONSTRAINT "facturas_numeracion_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("sucursales_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_numeracion" ADD CONSTRAINT "facturas_numeracion_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados_numeracion"("estado_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("venta_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_estado_sri_id_fkey" FOREIGN KEY ("estado_sri_id") REFERENCES "estado_sri"("estado_sri_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_usuario_emisor_id_fkey" FOREIGN KEY ("usuario_emisor_id") REFERENCES "usuarios"("usuarios_id") ON DELETE RESTRICT ON UPDATE CASCADE;

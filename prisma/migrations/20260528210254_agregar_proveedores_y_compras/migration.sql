-- CreateTable
CREATE TABLE "paises" (
    "pais_id" SERIAL NOT NULL,
    "codigo_iso" CHAR(3) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "codigo_iso2" CHAR(2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "paises_pkey" PRIMARY KEY ("pais_id")
);

-- CreateTable
CREATE TABLE "tipo_documento_compra" (
    "tipo_doc_id" SERIAL NOT NULL,
    "tipo_doc_codigo" VARCHAR(10) NOT NULL,
    "tipo_doc_nombre" VARCHAR(100) NOT NULL,
    "tipo_doc_activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tipo_documento_compra_pkey" PRIMARY KEY ("tipo_doc_id")
);

-- CreateTable
CREATE TABLE "estado_pago_compra" (
    "estado_pago_id" SERIAL NOT NULL,
    "estado_pago_codigo" VARCHAR(20) NOT NULL,
    "estado_pago_nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "estado_pago_compra_pkey" PRIMARY KEY ("estado_pago_id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "proveedor_id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "identificacion" VARCHAR(20) NOT NULL,
    "tipo_identificacion" CHAR(2) NOT NULL,
    "razon_social" VARCHAR(150) NOT NULL,
    "nombre_comercial" VARCHAR(150),
    "pais_id" INTEGER NOT NULL,
    "direccion" VARCHAR(255),
    "telefono" VARCHAR(20),
    "email" VARCHAR(100),
    "deleted_at" TIMESTAMP(3),
    "proveedor_creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("proveedor_id")
);

-- CreateTable
CREATE TABLE "compras" (
    "compra_id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "proveedor_id" INTEGER NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tipo_doc_id" INTEGER NOT NULL,
    "estado_pago_id" INTEGER NOT NULL,
    "numero_documento" VARCHAR(30) NOT NULL,
    "fecha_emision" DATE NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "descuento_global" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "porcentaje_impuesto" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "valor_impuesto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "gastos_envio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_pagar" DECIMAL(10,2) NOT NULL,
    "total_pagado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "compra_creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("compra_id")
);

-- CreateTable
CREATE TABLE "detalle_compras" (
    "detalle_id" SERIAL NOT NULL,
    "compra_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "lote_id" INTEGER,
    "cantidad" INTEGER NOT NULL,
    "costo_unitario" DECIMAL(10,2) NOT NULL,
    "descuento_linea" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotal_linea" DECIMAL(10,2) NOT NULL,
    "precio_venta_sugerido" DECIMAL(10,2),

    CONSTRAINT "detalle_compras_pkey" PRIMARY KEY ("detalle_id")
);

-- CreateTable
CREATE TABLE "pagos_compra" (
    "pago_id" SERIAL NOT NULL,
    "compra_id" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha_pago" DATE NOT NULL,
    "referencia" VARCHAR(100),
    "observaciones" TEXT,
    "pago_creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_compra_pkey" PRIMARY KEY ("pago_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paises_codigo_iso_key" ON "paises"("codigo_iso");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_documento_compra_tipo_doc_codigo_key" ON "tipo_documento_compra"("tipo_doc_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "estado_pago_compra_estado_pago_codigo_key" ON "estado_pago_compra"("estado_pago_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_empresa_id_identificacion_key" ON "proveedores"("empresa_id", "identificacion");

-- CreateIndex
CREATE UNIQUE INDEX "compras_empresa_id_numero_documento_proveedor_id_key" ON "compras"("empresa_id", "numero_documento", "proveedor_id");

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("empresas_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_tipo_identificacion_fkey" FOREIGN KEY ("tipo_identificacion") REFERENCES "tipo_identificacion_sri"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_pais_id_fkey" FOREIGN KEY ("pais_id") REFERENCES "paises"("pais_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("empresas_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("proveedor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("sucursales_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("usuarios_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_tipo_doc_id_fkey" FOREIGN KEY ("tipo_doc_id") REFERENCES "tipo_documento_compra"("tipo_doc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_estado_pago_id_fkey" FOREIGN KEY ("estado_pago_id") REFERENCES "estado_pago_compra"("estado_pago_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_compras" ADD CONSTRAINT "detalle_compras_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("compra_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_compras" ADD CONSTRAINT "detalle_compras_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_compras" ADD CONSTRAINT "detalle_compras_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "item_lotes"("lote_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_compra" ADD CONSTRAINT "pagos_compra_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("compra_id") ON DELETE RESTRICT ON UPDATE CASCADE;

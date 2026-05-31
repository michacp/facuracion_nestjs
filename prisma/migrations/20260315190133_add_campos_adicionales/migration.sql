-- CreateTable
CREATE TABLE "cliente_campos_adicionales" (
    "id" SERIAL NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "valor" VARCHAR(500) NOT NULL,

    CONSTRAINT "cliente_campos_adicionales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta_campos_adicionales" (
    "id" SERIAL NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "valor" VARCHAR(500) NOT NULL,

    CONSTRAINT "venta_campos_adicionales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cliente_campos_adicionales_cliente_id_clave_key" ON "cliente_campos_adicionales"("cliente_id", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "venta_campos_adicionales_venta_id_clave_key" ON "venta_campos_adicionales"("venta_id", "clave");

-- AddForeignKey
ALTER TABLE "cliente_campos_adicionales" ADD CONSTRAINT "cliente_campos_adicionales_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("empresas_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_campos_adicionales" ADD CONSTRAINT "cliente_campos_adicionales_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_campos_adicionales" ADD CONSTRAINT "venta_campos_adicionales_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("venta_id") ON DELETE CASCADE ON UPDATE CASCADE;

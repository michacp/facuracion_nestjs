-- DropForeignKey
ALTER TABLE "detalle_venta" DROP CONSTRAINT "detalle_venta_lote_id_fkey";

-- AlterTable
ALTER TABLE "detalle_venta" ADD COLUMN     "item_id" INTEGER,
ALTER COLUMN "lote_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "item_lotes"("lote_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;

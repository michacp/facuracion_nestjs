-- AlterTable
ALTER TABLE "items" ALTER COLUMN "item_nombre" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "usuario_empresa" ADD COLUMN     "deleted_at" TIMESTAMP(3);

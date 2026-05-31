/*
  Warnings:

  - A unique constraint covering the columns `[regimenes_nombre]` on the table `regimenes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "planes" ADD COLUMN     "plan_visible" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "regimenes_regimenes_nombre_key" ON "regimenes"("regimenes_nombre");

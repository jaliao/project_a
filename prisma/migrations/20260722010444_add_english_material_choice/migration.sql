-- AlterEnum
ALTER TYPE "MaterialChoice" ADD VALUE 'english';

-- AlterTable
ALTER TABLE "course_orders" ADD COLUMN     "englishQty" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "material_shipments" ADD COLUMN     "englishQty" INTEGER NOT NULL DEFAULT 0;

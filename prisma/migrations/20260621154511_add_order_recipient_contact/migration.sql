-- AlterTable
ALTER TABLE "course_orders" ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "recipientPhone" TEXT;

-- AlterTable
ALTER TABLE "material_shipments" ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "recipientPhone" TEXT;

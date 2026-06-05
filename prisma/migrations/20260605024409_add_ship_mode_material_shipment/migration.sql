-- CreateEnum
CREATE TYPE "ShipMode" AS ENUM ('single', 'multiple');

-- AlterTable
ALTER TABLE "course_orders" ADD COLUMN     "shipMode" "ShipMode" NOT NULL DEFAULT 'single';

-- CreateTable
CREATE TABLE "material_shipments" (
    "id" SERIAL NOT NULL,
    "courseOrderId" INTEGER NOT NULL,
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "deliveryAddress" TEXT,
    "storeId" TEXT,
    "storeName" TEXT,
    "traditionalQty" INTEGER NOT NULL DEFAULT 0,
    "simplifiedQty" INTEGER NOT NULL DEFAULT 0,
    "shippedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "material_shipments_courseOrderId_idx" ON "material_shipments"("courseOrderId");

-- AddForeignKey
ALTER TABLE "material_shipments" ADD CONSTRAINT "material_shipments_courseOrderId_fkey" FOREIGN KEY ("courseOrderId") REFERENCES "course_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

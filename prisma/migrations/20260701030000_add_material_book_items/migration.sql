-- AlterTable
ALTER TABLE "invite_enrollments" ADD COLUMN     "materialBookName" TEXT;

-- CreateTable
CREATE TABLE "material_shipment_items" (
    "id" SERIAL NOT NULL,
    "shipmentId" INTEGER NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "bookName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_shipment_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "material_shipment_items_shipmentId_idx" ON "material_shipment_items"("shipmentId");

-- CreateIndex
CREATE INDEX "material_shipment_items_enrollmentId_idx" ON "material_shipment_items"("enrollmentId");

-- AddForeignKey
ALTER TABLE "material_shipment_items" ADD CONSTRAINT "material_shipment_items_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "material_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_shipment_items" ADD CONSTRAINT "material_shipment_items_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "invite_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

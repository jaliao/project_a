-- DropForeignKey
ALTER TABLE "material_shipment_items" DROP CONSTRAINT "material_shipment_items_enrollmentId_fkey";

-- AlterTable
ALTER TABLE "course_invites" ADD COLUMN     "materialFinalizedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "material_shipment_items" ALTER COLUMN "enrollmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "material_shipment_items" ADD CONSTRAINT "material_shipment_items_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "invite_enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

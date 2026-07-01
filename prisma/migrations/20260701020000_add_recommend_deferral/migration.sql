-- AlterTable
ALTER TABLE "invite_enrollments" ADD COLUMN     "recommendDeferralNote" TEXT,
ADD COLUMN     "recommendDeferredAt" TIMESTAMP(3),
ADD COLUMN     "recommendDeferredById" UUID;

-- AddForeignKey
ALTER TABLE "invite_enrollments" ADD CONSTRAINT "invite_enrollments_recommendDeferredById_fkey" FOREIGN KEY ("recommendDeferredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mergedAt" TIMESTAMP(3),
ADD COLUMN     "mergedById" UUID,
ADD COLUMN     "mergedIntoId" UUID;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_mergedById_fkey" FOREIGN KEY ("mergedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

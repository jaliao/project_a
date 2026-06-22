-- CreateEnum
CREATE TYPE "SuspendReason" AS ENUM ('password_leak', 'user_request', 'other');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "suspendReason" "SuspendReason",
ADD COLUMN     "suspendReasonNote" TEXT,
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedById" UUID;

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('pending', 'approved');

-- CreateEnum
CREATE TYPE "MaterialChoice" AS ENUM ('none', 'traditional', 'simplified');

-- AlterTable
ALTER TABLE "course_invites" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "invite_enrollments" ADD COLUMN     "materialChoice" "MaterialChoice" NOT NULL DEFAULT 'none',
ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'pending';

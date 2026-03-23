-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('level1', 'level2', 'level3', 'level4');

-- AlterTable
ALTER TABLE "course_invites" ADD COLUMN     "courseLevel" "CourseLevel" NOT NULL DEFAULT 'level1';

/*
  Warnings:

  - You are about to drop the column `token` on the `course_invites` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "course_invites_token_key";

-- AlterTable
ALTER TABLE "course_invites" DROP COLUMN "token";

-- CreateEnum
CREATE TYPE "ChurchType" AS ENUM ('church', 'other', 'none');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "churchId" INTEGER,
ADD COLUMN     "churchOther" TEXT,
ADD COLUMN     "churchType" "ChurchType" NOT NULL DEFAULT 'none';

-- CreateTable
CREATE TABLE "churches" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "churches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "churches_name_key" ON "churches"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "handleChangedAt" TIMESTAMP(3),
ADD COLUMN     "loginHandle" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_loginHandle_key" ON "users"("loginHandle");

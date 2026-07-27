-- DropForeignKey
ALTER TABLE "support_inquiries" DROP CONSTRAINT "support_inquiries_userId_fkey";

-- AlterTable
ALTER TABLE "admin_action_logs" ALTER COLUMN "inviteTitle" DROP NOT NULL;

-- AlterTable
ALTER TABLE "support_inquiries" ADD COLUMN     "submitterChurchLabel" TEXT,
ADD COLUMN     "submitterGenderLabel" TEXT,
ADD COLUMN     "submitterName" TEXT,
ADD COLUMN     "submitterRealName" TEXT,
ADD COLUMN     "submitterSpiritId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "support_inquiries" ADD CONSTRAINT "support_inquiries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

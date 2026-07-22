-- AlterTable
ALTER TABLE "support_inquiries" ADD COLUMN     "courseInviteId" INTEGER;

-- AddForeignKey
ALTER TABLE "support_inquiries" ADD CONSTRAINT "support_inquiries_courseInviteId_fkey" FOREIGN KEY ("courseInviteId") REFERENCES "course_invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

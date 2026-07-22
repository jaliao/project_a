-- CreateEnum
CREATE TYPE "SupportInquiryCategory" AS ENUM ('account', 'course', 'material', 'other');

-- CreateEnum
CREATE TYPE "SupportInquiryStatus" AS ENUM ('pending', 'replied');

-- CreateTable
CREATE TABLE "support_inquiries" (
    "id" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "category" "SupportInquiryCategory" NOT NULL,
    "body" TEXT NOT NULL,
    "status" "SupportInquiryStatus" NOT NULL DEFAULT 'pending',
    "replyBody" TEXT,
    "repliedById" UUID,
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_inquiries_status_createdAt_idx" ON "support_inquiries"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "support_inquiries" ADD CONSTRAINT "support_inquiries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_inquiries" ADD CONSTRAINT "support_inquiries_repliedById_fkey" FOREIGN KEY ("repliedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

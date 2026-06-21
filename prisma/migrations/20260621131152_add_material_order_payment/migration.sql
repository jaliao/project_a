-- AlterTable
ALTER TABLE "course_orders" ADD COLUMN     "paymentConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "paymentLast5" TEXT,
ADD COLUMN     "paymentReportedAt" TIMESTAMP(3),
ADD COLUMN     "quotedAmount" INTEGER,
ADD COLUMN     "quotedAt" TIMESTAMP(3),
ADD COLUMN     "remittanceAccount" TEXT;

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('missing_record', 'wrong_teacher', 'not_graduated');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "learning_record_feedbacks" (
    "id" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "teacherName" TEXT NOT NULL,
    "courseCatalogId" INTEGER NOT NULL,
    "note" TEXT,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'pending',
    "resolvedById" UUID,
    "resolvedAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "resultInviteId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_record_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_record_feedbacks_status_createdAt_idx" ON "learning_record_feedbacks"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "learning_record_feedbacks" ADD CONSTRAINT "learning_record_feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_record_feedbacks" ADD CONSTRAINT "learning_record_feedbacks_courseCatalogId_fkey" FOREIGN KEY ("courseCatalogId") REFERENCES "course_catalogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_record_feedbacks" ADD CONSTRAINT "learning_record_feedbacks_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_record_feedbacks" ADD CONSTRAINT "learning_record_feedbacks_resultInviteId_fkey" FOREIGN KEY ("resultInviteId") REFERENCES "course_invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

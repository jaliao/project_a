-- 講師資格回饋：由課程建立者對已結業學員填寫（皆可空，無破壞性）
ALTER TABLE "invite_enrollments" ADD COLUMN     "teacherRecommended" BOOLEAN,
ADD COLUMN     "teacherFeedbackNote" TEXT,
ADD COLUMN     "teacherFeedbackAt" TIMESTAMP(3);

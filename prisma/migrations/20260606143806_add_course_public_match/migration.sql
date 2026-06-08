-- 新增公開媒合欄位
ALTER TABLE "course_invites" ADD COLUMN "isPublicMatch" BOOLEAN NOT NULL DEFAULT false,
                            ADD COLUMN "matchNote" TEXT;

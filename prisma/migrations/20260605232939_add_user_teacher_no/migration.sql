-- 新增授課老師編號欄位（可空，學員為 null）
ALTER TABLE "users" ADD COLUMN "teacherNo" TEXT;

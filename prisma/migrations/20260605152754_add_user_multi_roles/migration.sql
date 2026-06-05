-- 新增 teacher 身分值（PG15：可於交易內 ADD VALUE，惟不可於同交易使用新值；backfill 僅用既有值，安全）
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'teacher';

-- 新增 roles 多重身分欄位（預設僅含 user 基線）
ALTER TABLE "users" ADD COLUMN "roles" "UserRole"[] NOT NULL DEFAULT ARRAY['user']::"UserRole"[];

-- backfill：依既有單一 role 轉換為身分集合
UPDATE "users" SET "roles" = CASE
  WHEN "role" = 'superadmin' THEN ARRAY['user', 'superadmin']::"UserRole"[]
  WHEN "role" = 'admin' THEN ARRAY['user', 'admin']::"UserRole"[]
  ELSE ARRAY['user']::"UserRole"[]
END;

-- 移除舊的單一 role 欄位
ALTER TABLE "users" DROP COLUMN "role";

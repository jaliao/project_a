-- 將單一 teacher 身分拆為四個書籍講師身分（teacher_1~teacher_4）
-- PG 無法直接移除 enum 值，故重建 UserRole 型別；既有 teacher 對應為啟動靈人講師（teacher_1）

BEGIN;

-- 1. 建立新的 enum 型別
CREATE TYPE "UserRole_new" AS ENUM ('user', 'teacher_1', 'teacher_2', 'teacher_3', 'teacher_4', 'admin', 'superadmin');

-- 2. 移除舊預設值（引用舊型別）
ALTER TABLE "users" ALTER COLUMN "roles" DROP DEFAULT;

-- 3. 轉換欄位型別；將既有 'teacher' 文字置換為 'teacher_1' 後再轉為新 enum
ALTER TABLE "users"
  ALTER COLUMN "roles" TYPE "UserRole_new"[]
  USING (array_replace("roles"::text[], 'teacher', 'teacher_1')::"UserRole_new"[]);

-- 4. 汰換型別名稱
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";

-- 5. 還原預設值（引用新型別）
ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT ARRAY['user']::"UserRole"[];

COMMIT;

-- 顯示名稱模式改版：chinese/english → nickname/nickname_zh/nickname_en（預設 nickname）
-- PG 無法直接改 enum 值，故重建型別；既有 chinese→nickname_zh、english→nickname_en

BEGIN;

CREATE TYPE "DisplayNameMode_new" AS ENUM ('nickname', 'nickname_zh', 'nickname_en');

ALTER TABLE "users" ALTER COLUMN "displayNameMode" DROP DEFAULT;

ALTER TABLE "users"
  ALTER COLUMN "displayNameMode" TYPE "DisplayNameMode_new"
  USING (
    CASE "displayNameMode"::text
      WHEN 'chinese' THEN 'nickname_zh'
      WHEN 'english' THEN 'nickname_en'
      ELSE 'nickname'
    END::"DisplayNameMode_new"
  );

ALTER TYPE "DisplayNameMode" RENAME TO "DisplayNameMode_old";
ALTER TYPE "DisplayNameMode_new" RENAME TO "DisplayNameMode";
DROP TYPE "DisplayNameMode_old";

ALTER TABLE "users" ALTER COLUMN "displayNameMode" SET DEFAULT 'nickname';

COMMIT;

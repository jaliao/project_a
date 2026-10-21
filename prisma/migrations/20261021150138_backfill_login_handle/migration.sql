-- 一次性 backfill：既有會員以 spiritId 轉小寫衍生預設帳號代碼（cr-feat-261021-004）
-- 正常路徑：spiritId 存在時直接衍生
UPDATE "users"
SET "loginHandle" = lower("spiritId")
WHERE "loginHandle" IS NULL AND "spiritId" IS NOT NULL;

-- 防呆路徑：理論上 spiritId 可為 null（schema 允許），若存在這類既有資料列，
-- 改用 id 的前 16 個十六進位字元衍生，確保收緊為 NOT NULL 前 100% 覆蓋、且仍符合帳號代碼格式規則
UPDATE "users"
SET "loginHandle" = 'u' || substr(replace(id::text, '-', ''), 1, 16)
WHERE "loginHandle" IS NULL;

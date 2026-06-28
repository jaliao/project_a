-- 每筆教材訂單記錄繁/簡本數
-- 既有多地址訂單以 material_shipments 加總回填；單一地址歷史訂單維持 0

-- 1. 新增欄位（預設 0）
ALTER TABLE "course_orders" ADD COLUMN "traditionalQty" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "course_orders" ADD COLUMN "simplifiedQty" INTEGER NOT NULL DEFAULT 0;

-- 2. 回填多地址訂單（由寄送批次加總）
UPDATE "course_orders" o
SET "traditionalQty" = s."sumTrad",
    "simplifiedQty"  = s."sumSimp"
FROM (
  SELECT "courseOrderId",
         SUM("traditionalQty") AS "sumTrad",
         SUM("simplifiedQty")  AS "sumSimp"
  FROM "material_shipments"
  GROUP BY "courseOrderId"
) s
WHERE o."id" = s."courseOrderId";

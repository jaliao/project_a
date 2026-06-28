-- 一門課支援多筆教材訂單：CourseInvite↔CourseOrder 由一對一翻轉為一對多
-- 資料保留：以既有 course_invites.courseOrderId 反向回填 course_orders.courseInviteId

-- 1. 於 course_orders 新增可空 FK 欄位
ALTER TABLE "course_orders" ADD COLUMN "courseInviteId" INTEGER;

-- 2. 回填既有關聯（原一對一連結）
UPDATE "course_orders" o
SET "courseInviteId" = i."id"
FROM "course_invites" i
WHERE i."courseOrderId" = o."id";

-- 3. 建立索引
CREATE INDEX "course_orders_courseInviteId_idx" ON "course_orders"("courseInviteId");

-- 4. 新增外鍵（一對多：order → invite；optional 關聯預設 ON DELETE SET NULL）
ALTER TABLE "course_orders" ADD CONSTRAINT "course_orders_courseInviteId_fkey" FOREIGN KEY ("courseInviteId") REFERENCES "course_invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. 移除舊的一對一外鍵與欄位
ALTER TABLE "course_invites" DROP CONSTRAINT "course_invites_courseOrderId_fkey";
ALTER TABLE "course_invites" DROP COLUMN "courseOrderId";

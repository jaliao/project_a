-- 新增課程簡介欄位
ALTER TABLE "course_catalogs" ADD COLUMN "description" TEXT;

-- 修正先修關聯為累積式
-- A = 該課程（需先修 B 才能報名/開設）
-- B = 先修課程
DELETE FROM "_CoursePrerequisites";
INSERT INTO "_CoursePrerequisites" ("A", "B") VALUES
(2, 1),   -- 啟動靈人 2 需先修 啟動靈人 1
(3, 1),   -- 啟動靈人 3 需先修 啟動靈人 1
(3, 2),   -- 啟動靈人 3 需先修 啟動靈人 2
(4, 1),   -- 啟動靈人 4 需先修 啟動靈人 1
(4, 2),   -- 啟動靈人 4 需先修 啟動靈人 2
(4, 3);   -- 啟動靈人 4 需先修 啟動靈人 3

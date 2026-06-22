-- 廢除「啟動事工 4 / 啟動靈人 4」課程目錄（id=4）與其先修關聯
DELETE FROM "_CoursePrerequisites" WHERE "A" = 4 OR "B" = 4;
DELETE FROM "course_catalogs" WHERE "id" = 4;

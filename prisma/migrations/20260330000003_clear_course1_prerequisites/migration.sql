-- 清除啟動靈人 1（id=1）的所有先修關聯（A 欄位為擁有先修的課程）
DELETE FROM "_CoursePrerequisites" WHERE "A" = 1;

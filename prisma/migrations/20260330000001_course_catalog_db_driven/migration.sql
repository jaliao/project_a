-- 課程目錄 DB 驅動 migration
-- 1. 建立 course_catalogs 表
-- 2. 建立先修課程多對多關聯表
-- 3. 插入初始資料（啟動靈人 1-4）
-- 4. 新增 courseCatalogId 至 course_invites
-- 5. 刪除舊 courseLevel 欄位

-- Step 1: 建立 course_catalogs
CREATE TABLE "course_catalogs" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "course_catalogs_pkey" PRIMARY KEY ("id")
);

-- Step 2: 建立先修課程多對多關聯表
CREATE TABLE "_CoursePrerequisites" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_CoursePrerequisites_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_CoursePrerequisites_B_index" ON "_CoursePrerequisites"("B");

ALTER TABLE "_CoursePrerequisites" ADD CONSTRAINT "_CoursePrerequisites_A_fkey" FOREIGN KEY ("A") REFERENCES "course_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CoursePrerequisites" ADD CONSTRAINT "_CoursePrerequisites_B_fkey" FOREIGN KEY ("B") REFERENCES "course_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 3: 插入初始課程資料
INSERT INTO "course_catalogs" ("label", "isActive", "sortOrder") VALUES
('啟動靈人 1', true, 1),
('啟動靈人 2', true, 2),
('啟動靈人 3', false, 3),
('啟動靈人 4', false, 4);

-- 設定先修關聯（啟動靈人 2 先修啟動靈人 1，以此類推）
INSERT INTO "_CoursePrerequisites" ("A", "B") VALUES
(2, 1),
(3, 2),
(4, 3);

-- Step 4: 新增 courseCatalogId 欄位（先允許 null 以便處理既有資料）
ALTER TABLE "course_invites" ADD COLUMN "courseCatalogId" INTEGER;

-- 將既有 course_invites 的 courseLevel 對應至 catalog id
UPDATE "course_invites" SET "courseCatalogId" = 1 WHERE "courseLevel" = 'level1';
UPDATE "course_invites" SET "courseCatalogId" = 2 WHERE "courseLevel" = 'level2';
UPDATE "course_invites" SET "courseCatalogId" = 3 WHERE "courseLevel" = 'level3';
UPDATE "course_invites" SET "courseCatalogId" = 4 WHERE "courseLevel" = 'level4';
-- 其他情況 fallback 至 level1
UPDATE "course_invites" SET "courseCatalogId" = 1 WHERE "courseCatalogId" IS NULL;

-- 設定 NOT NULL 與 FK
ALTER TABLE "course_invites" ALTER COLUMN "courseCatalogId" SET NOT NULL;
ALTER TABLE "course_invites" ADD CONSTRAINT "course_invites_courseCatalogId_fkey" FOREIGN KEY ("courseCatalogId") REFERENCES "course_catalogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 5: 刪除舊 courseLevel 欄位（enum 隨之廢棄）
ALTER TABLE "course_invites" DROP COLUMN "courseLevel";

-- 刪除 CourseLevel enum（若存在）
DROP TYPE IF EXISTS "CourseLevel";

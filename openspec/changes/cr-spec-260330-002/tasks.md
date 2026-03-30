## 1. Schema 重構

- [x] 1.1 新增 `prisma/schema/course-catalog.prisma`，定義 `CourseCatalog` model（id, label, isActive, sortOrder, prerequisites 多對多自關聯）
- [x] 1.2 移除 `prisma/schema/course-invite.prisma` 中的 `CourseLevel` enum；將 `CourseInvite.courseLevel` 改為 `courseCatalogId Int` + `courseCatalog CourseCatalog @relation(...)`
- [x] 1.3 執行 `make schema-update name=course_catalog_db_driven`，確認 migration 產生成功
- [x] 1.4 更新 `prisma/seed.ts`，插入四筆 `CourseCatalog` 初始資料（啟動靈人 1–4，含先修關聯），執行 `make prisma-seed` 驗證

## 2. Data Layer

- [x] 2.1 新增 `lib/data/course-catalog.ts`，實作以下 async 函式：`getAllCourses()`、`getActiveCourses()`、`getCourse(id)`、`getPrerequisites(catalogId)`
- [x] 2.2 新增 `checkPrerequisites(userId, targetCatalogId)` helper，查詢使用者的結業課程 id 集合，比對目標課程所有先修，回傳缺少的課程清單
- [x] 2.3 移除 `lib/data/` 中的 `getUserLearningLevel()` 函式（搜尋並更新所有呼叫端）

## 3. Zod Schema 更新

- [x] 3.1 更新 `lib/schemas/course-invite.ts`：移除 `courseLevel` 欄位（`CourseLevel` enum），改為 `courseCatalogId: z.number().int().positive()`
- [x] 3.2 更新 `lib/schemas/course-session.ts`：同上，移除 `CourseLevel` 引用，改為 `courseCatalogId`

## 4. Server Actions 更新

- [x] 4.1 更新 `app/actions/course-invite.ts`：`createInvite` 改用 `courseCatalogId`；先修驗證改呼叫 `checkPrerequisites()`，錯誤訊息顯示 `CourseCatalog.label`
- [x] 4.2 更新 `app/actions/course-session.ts`：`createCourseSession` 同上；移除 `getUserLearningLevel()` 呼叫
- [x] 4.3 新增 `app/actions/course-catalog.ts`：實作 `updateCourse(id, data)`（更新 label、isActive、prerequisites），加入 admin/superadmin 權限驗證

## 5. Admin UI

- [x] 5.1 新增 `app/(user)/admin/course-catalog/page.tsx`：Server Component，讀取所有課程資料，加入 admin/superadmin 存取限制（非 admin 重導或顯示 403）
- [x] 5.2 新增 `components/course-catalog/course-catalog-table.tsx`：顯示課程列表（名稱、isActive 狀態、先修課程名稱）
- [x] 5.3 新增 `components/course-catalog/edit-course-dialog.tsx`：編輯 Dialog，含課程名稱 Input、isActive Switch、先修課程 Checkbox group（排除自身）
- [x] 5.4 在 admin 後台頁面或側邊欄加入「課程目錄」入口連結

## 6. 元件與頁面更新（替換 CourseLevel 引用）

- [x] 6.1 更新 `components/course-invite/create-invite-form.tsx`：課程選單改從 `getActiveCourses()` 讀取，value 改為 `courseCatalogId`
- [x] 6.2 更新 `components/course-session/create-course-wizard/step-1-course-card.tsx`：課程顯示改用 DB label
- [x] 6.3 更新 `components/course-session/create-course-wizard/step-2-basic-info.tsx`：同上
- [x] 6.4 更新 `components/course-session/create-course-wizard/create-course-wizard.tsx`：移除 `CourseLevel` 型別引用
- [x] 6.5 更新 `components/course-session/course-session-form.tsx`：課程欄位改為 `courseCatalogId`
- [x] 6.6 更新 `components/course-session/course-session-card.tsx`：課程名稱改從 `courseCatalog.label` 讀取
- [x] 6.7 更新 `components/course-invite/completion-certificate-card.tsx`：課程名稱改從 DB 讀取
- [x] 6.8 更新 `components/learning/level-progress.tsx`：移除 `getUserLearningLevel()`，改為顯示已結業課程清單（`CourseCatalog.label`）
- [x] 6.9 更新 `app/(user)/learning/page.tsx`、`app/(user)/course-sessions/page.tsx`、`app/(user)/course/[id]/page.tsx`、`app/(user)/course/[id]/graduate/page.tsx`：課程資料改從 DB 查詢
- [x] 6.10 更新 `app/(user)/user/[spiritId]/page.tsx`、`app/(user)/user/[spiritId]/courses/page.tsx`：同上
- [x] 6.11 更新 `app/(user)/admin/page.tsx`：`CourseSessionCard` 等元件的 `courseLevel` prop 改為 `courseCatalogId` 或 `courseCatalog`
- [x] 6.12 更新 `lib/data/course-sessions.ts`：查詢結果包含 `courseCatalog` relation（`include: { courseCatalog: true }`）

## 7. 清理與驗證

- [x] 7.1 刪除 `config/course-catalog.ts`
- [x] 7.2 執行 `npm run build`，確認無 TypeScript 編譯錯誤
- [x] 7.3 執行 `npm run lint`，確認無 lint 錯誤（專案未配置 eslint config，跳過）
- [x] 7.4 更新 `config/version.json` patch 版本號 +1
- [x] 7.5 更新 `README-AI.md`

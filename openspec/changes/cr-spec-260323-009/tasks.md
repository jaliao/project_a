## 1. 課程目錄設定與資料庫模型

- [x] 1.1 新增 `config/course-catalog.ts`，定義 `COURSE_CATALOG`（level1～4，含 label、isActive、prerequisiteLevel）與輔助型別 `CourseLevel`、`getActiveCourses()`、`getCourse(level)`
- [x] 1.2 在 `prisma/schema/course-invite.prisma` 新增 `CourseLevel` enum（`level1 | level2 | level3 | level4`）與 `CourseInvite.courseLevel CourseLevel @default(level1)` 欄位
- [x] 1.3 執行 `make schema-update name=add_course_level_to_invite` 產生 migration 並更新 Prisma client

## 2. Zod Schema 更新

- [x] 2.1 更新 `lib/schemas/course-invite.ts` 的 `createInviteSchema`：移除 `title`，新增 `courseLevel: z.enum(['level1','level2','level3','level4'])`

## 3. Server Actions 更新

- [x] 3.1 在 `app/actions/course-invite.ts` 新增 `getUserLearningLevel(userId)` helper：查詢該使用者所有 InviteEnrollment 的 courseLevel，回傳最高 level 數字（0 表示無）
- [x] 3.2 更新 `createInvite`：接收 `courseLevel` 取代 `title`；驗證教師 learningLevel >= courseLevel 數字；以 `COURSE_CATALOG[courseLevel].label` 作為 title 寫入 DB
- [x] 3.3 更新 `joinInvite`：查詢邀請的 courseLevel，取得 prerequisiteLevel；若 prerequisiteLevel > 0 則驗證學員 learningLevel >= prerequisiteLevel，否則回傳錯誤
- [x] 3.4 新增 `getMyLearningRecords()`：回傳 `{ enrollments, invites, learningLevel }`（enrollments 含 invite.courseLevel/title/createdBy；invites 含 courseLevel/title/_count.enrollments）

## 4. 建立邀請表單更新

- [x] 4.1 更新 `components/course-invite/create-invite-form.tsx`：移除 title Input，改為 courseLevel Select（渲染 `getActiveCourses()` 清單）；form defaultValues 對應更新

## 5. 學習紀錄頁面

- [x] 5.1 新增 `components/learning/level-progress.tsx`（Server Component）：顯示四個等級的進度列（已完成 / 未完成），以 learningLevel 決定完成狀態
- [x] 5.2 新增 `app/(user)/learning/page.tsx`（Server Component，`force-dynamic`）：呼叫 `getMyLearningRecords()`，頂部渲染 `<LevelProgress>`，下方分「已完成學習」與「已完成授課」兩個區塊，各自有空狀態提示

## 6. Dashboard 整合

- [x] 6.1 在 `app/(user)/dashboard/page.tsx` 於統計卡片下方新增「學習紀錄」快速連結（`<Link href="/learning">`）

## 7. 版本與文件

- [x] 7.1 更新 `config/version.json` patch 版本號 +1
- [x] 7.2 更新 `README-AI.md`（新增 CourseLevel enum、course-catalog 設定、learning-records 頁面、LevelProgress 元件，更新任務狀態）

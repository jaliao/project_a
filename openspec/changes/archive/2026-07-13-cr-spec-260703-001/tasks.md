# Tasks — 紀錄開始上課日期＋課程時間顯示與編輯（cr-spec-260703-001）

## 1. Server Actions 與 Schema

- [x] 1.1 `app/actions/course-invite.ts` `startCourseSession` 增加 `startDate: string` 參數：Zod 驗證 `YYYY-MM-DD`、不得晚於伺服器當日（允許過去）；通過後將所選日期寫入 `startedAt`；門檻驗證不變
- [x] 1.2 `lib/schemas/course-session.ts` 新增進行中／已結業的編輯欄位驗證（進行中：title＋startedAt；已結業：title＋startedAt＋completedAt；completedAt ≥ startedAt 且 ≤ 今天）
- [x] 1.3 `app/actions/course-session.ts` `updateCourseInfo` 改依 **DB 當下狀態**決定欄位白名單與驗證：招生中維持現行、進行中/已結業依 1.2、已取消拒絕；僅更新白名單欄位、不連動學員 `graduatedAt`

## 2. UI — 開始上課（course-detail-actions.tsx）

- [x] 2.1 頁面補傳 `approvedCount: number` prop 給 `CourseDetailActions`
- [x] 2.2 開始上課區塊：按鈕上方新增「開始上課日期」`<input type="date">`（預設今天、`max` 今天）；點按鈕改開確認 Dialog（所選日期＋已核准人數，確認開始／取消）；確認後帶日期呼叫 action；字串維持寫死繁體

## 3. UI — 課程頁顯示與編輯

- [x] 3.1 `page.tsx` 基本資訊區：已開始顯示「開始上課日期」、已結業再顯示「結業日期」（`formatDate`，所有可檢視者可見）
- [x] 3.2 `page.tsx` 編輯入口條件由「僅招生中」改為「非已取消」（授課老師或管理者），傳入課程狀態與 `startedAt`/`completedAt` 初始值
- [x] 3.3 `edit-course-info-dialog.tsx` 依狀態切換欄位集（招生中：現行五欄；進行中：名稱＋開始日期；已結業：名稱＋開始日期＋結業日期），日期欄位 `max` 今天、結業日期 min 為開始日期

## 4. 文件與版本

- [x] 4.1 `doc/老師手冊.md`「開始上課」與「編輯課程資訊」流程補日期欄位、確認視窗、狀態別可編輯欄位說明；更新檔首版本與日期（管理者手冊如有編輯課程相關章節一併檢查）
- [x] 4.2 `config/version.json` patch 版本號 +1
- [x] 4.3 依 `.ai-rules.md` 更新 `README-AI.md`（版本號＋本變更摘要）

## 5. 驗證

- [x] 5.1 `npm run lint` 與 `npm run build` 通過
- [x] 5.2 手動驗證：①選過去日期開課成功且課程頁顯示該日期；②確認視窗取消不動作；③未來日期被 server 拒絕；④進行中改名稱＋開始日期成功、夾帶結業日期被忽略；⑤已結業改三欄成功且結業日期早於開始日期被拒；⑥已取消課程無編輯入口且 action 拒絕

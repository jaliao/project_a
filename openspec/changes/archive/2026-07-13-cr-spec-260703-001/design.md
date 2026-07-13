# 紀錄開始上課日期＋課程時間顯示與編輯 — 技術設計

## Context

- 「開始上課」：`course-detail-actions.tsx`（client、字串寫死繁體）按鈕點擊即呼叫 `startCourseSession(inviteId)`，server 驗證開課門檻後 `startedAt = new Date()`。元件 props 只有 `hasApprovedStudents` 布林，無人數。
- 課程頁：基本資訊區顯示預計開課日（`courseDate`）等，**未顯示** `startedAt`；結業資訊區塊（僅講師/管理者）以「最後一堂課程日期」顯示 `completedAt`。
- 編輯課程資訊：`EditCourseInfoDialog` 僅招生中顯示（`page.tsx` 條件 `canEditInfo && !startedAt && !isCancelled && !isCompleted`）；`updateCourseInfo` server 端同樣拒絕非招生中；欄位：名稱／人數／截止日／預計開課日／備註（`editCourseInfoSchema`）。

## Goals / Non-Goals

**Goals:**
- 開課改為講師自選日期（預設今天）＋確認視窗（日期＋已核准人數）。
- 課程頁對所有可檢視者顯示開始上課日期（已開始）與結業日期（已結業）。
- 進行中可改名稱＋開始日期；已結業可改名稱＋開始日期＋結業日期（授課老師或管理者）。

**Non-Goals:**
- 不改開課門檻判定與課程狀態機；已取消課程維持不可編輯。
- 無新資料欄位、無 migration。
- 改班級 `completedAt` 不連動學員個人 `graduatedAt`（個人結業日於結業作業時已寫定）。
- 不遷移相關元件既有字串至 i18n。

## Decisions

1. **沿用 `startedAt` / `completedAt` 儲存，無 migration**
   兩欄位語意不變（有值即進行中／已結業），改存講師指定日期不影響任何 null 判定。

2. **日期驗證規則（開課與編輯共用同一原則）**
   - `startedAt`：有效日期、不得晚於伺服器當日（允許過去）。前端 `<input type="date">` 設 `max` 今天。
   - `completedAt`（僅已結業編輯）：有效日期、不得晚於伺服器當日、**不得早於該課程 `startedAt`**。
   - 極端時差風險可忽略（使用者與伺服器皆台灣時區）。

3. **`startCourseSession(inviteId, startDate: string)`，Zod 於 action 內驗證**
   `YYYY-MM-DD` 字串，action 內驗證並轉 `Date`。無 RHF 表單，不需獨立 schema。

4. **開課確認視窗比照既有 Dialog 慣例**
   於 `course-detail-actions.tsx` 新增確認 Dialog：顯示「開課日期」「上課人數（已核准）」；「確認開始」才呼叫 action。原按鈕改為開啟 Dialog；門檻 disabled 行為不變。新增 `approvedCount: number` prop（頁面既有資料補傳；`hasApprovedStudents` 保留供結業區塊）。

5. **編輯課程資訊：同一 Dialog 依狀態切換欄位集，action 依狀態套白名單**
   - 狀態欄位集——招生中：現行五欄（含既有人數規則）；進行中：`title`＋`startedAt`；已結業：`title`＋`startedAt`＋`completedAt`；已取消：無（入口不顯示、action 拒絕）。
   - `page.tsx` 編輯入口條件由「僅招生中」改為「非已取消」；傳入課程狀態與 `startedAt`/`completedAt` 初始值。
   - `EditCourseInfoDialog` 依狀態渲染對應欄位；`lib/schemas/course-session.ts` 新增進行中/已結業編輯 schema（或單一 schema 依狀態 superRefine 分流），client/server 共用。
   - `updateCourseInfo` 以 DB 當下狀態（非 client 宣稱）決定允許欄位與驗證，只更新該狀態白名單內欄位。

6. **日期顯示位置：基本資訊區塊**
   已開始顯示「開始上課日期」、已結業再顯示「結業日期」，所有可檢視課程頁者可見（結業資訊區塊之「最後一堂課程日期」沿用 `completedAt`，編輯後自動一致）。顯示格式沿用既有 `formatDate`。

7. **新字串維持寫死繁體**
   `course-detail-actions.tsx` 與 `edit-course-info-dialog.tsx` 全檔字串尚未遷移 i18n（漸進遷移），僅少數新字串引入 `useTranslations` 會混語；`page.tsx` 資訊區若該區既用 `t()` 則新標籤補 i18n key，否則比照鄰近寫法。

## Risks / Trade-offs

- **[已結業課程改 `completedAt` 與學員 `graduatedAt` 不一致]** → 設計上班級結業日與個人結業日本可不同（補結業情境已存在）；明確列為 Non-Goal，不連動。
- **[updateCourseInfo 欄位白名單依狀態分流增加複雜度]** → 以 DB 狀態單一 switch 決定 schema＋update payload，集中一處、易測。
- **[startedAt 由精確時間變日期]** → 既有顯示僅格式化日期、判定皆 null 檢查，無影響。

## Migration Plan

無 migration；部署即生效。回滾為還原程式碼。

## Open Questions

（無）

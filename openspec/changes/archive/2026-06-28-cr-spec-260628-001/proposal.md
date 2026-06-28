## Why

目前課程 FAQ 留言區塊對「所有可瀏覽該課程頁的登入會員」公開可見，任何學員都能看到別人的提問與老師回覆。提問內容常涉及個人狀況（報名疑慮、付款、個別學習問題），公開呈現有隱私疑慮。需將 FAQ 改為 **1 對 1**：每則提問串僅「提問者本人」與「該課程授課老師」可見。

## What Changes

- **BREAKING**（行為變更）：FAQ 留言可見性由「課程內公開」改為「1 對 1 私訊」。
  - 一般會員：在 FAQ 區塊**只看得到自己張貼的提問串**（含老師對該串的回覆），看不到其他會員的提問。
  - 授課老師（開課者本人）：看得到該課程**所有**提問串（維持現況，可逐串回覆）。
- 資料查詢層 `getCourseMessages` 需新增「檢視者」參數，依檢視者身分過濾：老師回傳全部、其他會員僅回傳 `top-level author === 檢視者` 的串。
- 課程詳情頁 `/course/[id]` 傳入檢視者身分（`currentUserId` / `isInstructor`）給資料層。
- 提問、回覆、刪除、Inbox 通知等寫入與權限規則維持不變（提問者本就有權見自己的串、老師本就有權見全部，故無需放寬）。
- 空狀態文案維持（會員自己尚無提問時顯示空狀態）。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `course-faq`: 「課程 FAQ 留言區塊」需求的可見性規則由「對所有可瀏覽該課程頁的登入會員公開可見」改為「每則提問串僅提問者本人與該課程授課老師可見（1 對 1）」。提問／回覆／刪除權限需求不變。

## Impact

- 資料層：`lib/data/course-message.ts`（`getCourseMessages` 新增 viewer 過濾）
- 頁面：`app/(user)/course/[id]/page.tsx`（傳入檢視者身分）
- 元件：`components/course-faq/course-faq.tsx`（空狀態文案可能微調，邏輯不變）
- 規格：`openspec/specs/course-faq/spec.md`（delta 修改可見性需求）
- 文件：依 CLAUDE.md 第 9 點同步 `doc/` 三份手冊（老師手冊／學員手冊）與版本號
- 不涉及 schema 變更（`CourseMessage` 既有 `authorId` / `parentId` 已足夠支援過濾）

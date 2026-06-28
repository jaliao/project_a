## Context

課程 FAQ 目前以 `getCourseMessages(inviteId)`（`lib/data/course-message.ts`）撈出該課程**全部** top-level 提問與內嵌回覆，於 `/course/[id]` server component 取得後，原樣傳給 client 元件 `CourseFaq`。`CourseFaq` 已收到 `currentUserId` 與 `isInstructor` 兩個 props（目前僅用於決定刪除按鈕與回覆表單顯示）。

寫入端（`app/actions/course-message.ts`）的提問／回覆／刪除權限已是正確的：提問者操作自己的串、老師操作全部，本變更不需放寬或收緊寫入權限。本變更純粹是**讀取（可見性）過濾**：讓非老師會員只讀得到自己的提問串。

## Goals / Non-Goals

**Goals:**
- FAQ 讀取改為 1 對 1：發問者只見自己的串，授課老師見全部。
- 過濾在資料層（server 端）完成，避免他人留言內容外洩到 client payload。

**Non-Goals:**
- 不改 `CourseMessage` schema（既有 `authorId` / `parentId` 足夠）。
- 不改提問／回覆／刪除的寫入權限與 Inbox 通知行為。
- 不為老師端做「依發問者分組」的 UI 重排（維持現有平鋪、時間排序）。

## Decisions

**決策 1：在 `getCourseMessages` 新增 viewer 參數，於 `where` 過濾。**
簽章改為 `getCourseMessages(inviteId, viewer: { userId: string; isInstructor: boolean })`。
- `isInstructor === true` → `where: { inviteId, parentId: null }`（現況，全部）。
- 否則 → `where: { inviteId, parentId: null, authorId: viewer.userId }`（僅自己的提問串）。
回覆為內嵌 `replies`，隨 top-level 串一併帶出；老師回覆雖 `authorId` 為老師，但因掛在發問者的 top-level 串下，發問者仍可見，符合 1 對 1。

*替代方案*：在 client 端過濾 → 否決，他人留言仍會進入 server→client payload，有資料外洩風險，且 SSR 內容外露。

**決策 2：呼叫端傳入既有的 `currentUserId` / `isInstructor`。**
`page.tsx` 第 82–86 行已算出兩值，僅需把它們傳進 `getCourseMessages`，零額外查詢。

**決策 3：空狀態文案維持現有 client 邏輯（`messages.length === 0`）。**
過濾後一般會員自己無提問時 `messages` 即為空陣列，現有空狀態自動成立，元件邏輯不需改（文案可微調為更貼近「您尚無提問」，非必要）。

## Risks / Trade-offs

- [老師身分判定依賴呼叫端傳入的 `isInstructor`] → 由 server component 以 `session.user.id === courseSession.createdBy.id` 計算，與寫入端權限同源，風險低；資料層不自行重判以免重複查詢。
- [既有呼叫點若漏改參數] → 全庫僅 `page.tsx` 一處呼叫 `getCourseMessages`（已確認），改動面可控；TypeScript 必填參數可在編譯期攔截遺漏。

## Migration Plan

無資料庫遷移。純程式碼變更，部署即生效；回滾為還原 `getCourseMessages` 簽章與呼叫點即可。

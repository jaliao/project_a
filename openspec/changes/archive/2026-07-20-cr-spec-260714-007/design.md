# Design: cr-spec-260714-007 後台學員頁面優化

## Context

後台會員詳情頁（`app/[locale]/(admin)/admin/members/[id]/page.tsx`）基本資料分頁：

- `User.birthYear`（西元年 4 位數、可空，見 member-birth-year spec）已存在，但 `getMemberDetail` 未 select、頁面未顯示。
- 學習紀錄（`inviteEnrollments`，`startedAt IS NOT NULL`）與授課紀錄（`courseInvites`）以自製 `<table>` 呈現，僅三欄（課程名稱／課程目錄／開始授課日期），與全站課程呈現不一致。
- 全站標準課程卡片為 `CourseSessionCard`（`components/course-session/course-session-card.tsx`，client 元件），props：`inviteId`、`title`、`courseCatalogId`、`courseCatalogLabel`、`courseDate`、`maxCount`、`enrolledCount`、`expiredAt`、`startedAt`、`cancelledAt`、`completedAt`、`href`、`variant` 等，已含狀態徽章、人數進度、i18n。

## Goals / Non-Goals

**Goals:**
- 基本資料分頁顯示年齡（由 `birthYear` 計算）。
- 學習紀錄、授課紀錄改用 `CourseSessionCard` 卡片牆，可點擊進入課程頁。
- `getMemberDetail` 補齊卡片所需欄位。

**Non-Goals:**
- 不修改 `CourseSessionCard` 元件本身。
- 不新增 schema／migration（`birthYear` 已存在）。
- 不改前台（學員本人）個人資料頁；不動其他分頁（學習階層／講師身分／特殊設定）。
- 不顯示個人結業狀態於卡片（卡片顯示課程本身狀態，非該學員的 graduatedAt）。

## Decisions

1. **年齡計算方式：`當年西元年 − birthYear`**
   - 只存出生年、無月日，無法精確到生日；採「今年會滿的歲數」即可，後台參考用途足夠。
   - 顯示格式 `NN 歲`；`birthYear` 為 null 顯示 `—`。
   - 於 server component 內計算（`new Date().getFullYear()`），不需另建工具函式（僅此頁使用；dashboard demographics 已有自己的年齡分布邏輯，不共用）。

2. **卡片牆版面：`grid gap-4 sm:grid-cols-2`，`variant="compact"`**
   - 與既有卡片使用處（dashboard、開課查詢）一致的 grid 模式（參考 `course-card-grid`）；手機單欄、桌機兩欄。
   - 兩區塊維持既有外框（`rounded-lg border` + 區塊標題），內容由 `<table>` 換為卡片 grid；空狀態文案不變。

3. **卡片連結 `href`：一律連至 `/course/{inviteId}`**
   - 管理者具 admin 身分可存取課程詳情頁；提供從會員頁直達課程頁的入口。
   - 使用 `newTab` 預設（同頁導航），不強制開新分頁。

4. **資料層：擴充 `getMemberDetail` select，而非另建查詢**
   - `inviteEnrollments.invite` 與 `courseInvites` 補 select：`courseDate`、`maxCount`、`expiredAt`、`cancelledAt`、`completedAt`、`_count: { select: { enrollments: true } }`（報名人數）。
   - 頂層補 `birthYear`。
   - 單一查詢維持原子性與現行呼叫介面（`MemberDetail` 型別自動跟進），不影響其他呼叫端（僅此頁使用）。
   - ⚠️ `_count.enrollments` 需確認 relation 名稱與其他卡片使用處一致（比照 dashboard／開課查詢頁的查法）。

5. **Server → Client 邊界**
   - 頁面為 server component，`CourseSessionCard` 為 client 元件；傳入的 `expiredAt`/`startedAt` 等 Date props 為既有支援型別（其他 server 頁面已同樣傳遞），無序列化疑慮。

## Risks / Trade-offs

- [卡片資訊較表格多、佔位較大，紀錄多時頁面變長] → compact variant＋兩欄 grid 控制高度；紀錄量在後台情境可接受，不做分頁。
- [`_count` 統計的報名人數定義（是否含取消）與其他頁面不一致] → 實作時比照既有卡片使用處（如 dashboard/`lib/data/`) 的計數條件，保持全站一致。
- [年齡以年份估算可能與實際差 1 歲] → 後台參考用途可接受；欄位僅顯示不參與任何邏輯。

## Migration Plan

無 schema 變更；純前端＋資料層 select 擴充，隨一般部署上線，可直接 revert 回滾。

## Open Questions

（無）

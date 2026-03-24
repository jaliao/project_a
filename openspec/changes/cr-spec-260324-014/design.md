## Context

cr-spec-260324-013 實作完成後，透過 bug fix 與 UI 調整補入以下決策，本文件記錄其技術背景。

## Goals / Non-Goals

**Goals:**
- 補齊 spec 與程式碼的差異，確保文件一致性
- 無新功能開發

**Non-Goals:**
- 不修改任何已實作的邏輯

## Decisions

### D1：Spirit ID URL 使用小寫

URL 全小寫（`/user/pa260001`）符合 HTTP 慣例，避免大小寫造成的 404。Page component 在查詢前執行 `id.toUpperCase()` 轉換，DB 中的 spiritId 維持大寫（`PA260001`）不變。

### D2：個人功能單元移至本人頁面

ProfileBanner、授課單元、管理者單元改由 `isOwnPage`（`session.user.spiritId.toLowerCase() === spiritId`）控制顯示，讓 `/user/[spiritId]` 成為本人的操作入口，而不只是靜態資料展示頁。`/admin` 則專注管理統計。

### D5：動態路由 slug 名稱統一為 `[spiritId]`

Next.js 要求同一路徑下的巢狀動態段落使用相同的 slug 名稱。`/user/[spiritId]/page.tsx` 與 `/user/[spiritId]/courses/page.tsx` 必須共用相同目錄名稱，因此將原本的 `[id]` 目錄重新命名為 `[spiritId]`，params 型別對應調整為 `{ spiritId: string }`。

### D3：learningLevel 欄位

`User.learningLevel Int @default(0)` 儲存學員完成的最高課程等級，0 表示未完成任何課程，1～4 對應啟動靈人課程等級。

### D4：spiritId null redirect

登入後若 `session.user.spiritId` 為 null（新帳號尚未核發），redirect 至 `/profile` 引導完成資料填寫，而非 `/login`。

## Risks / Trade-offs

- **URL 大小寫**：舊連結若為大寫（`/user/PA260001`）將 404。目前無外部分享連結，風險低。
- **isOwnPage 判斷**：依賴 spiritId 比對，若 spiritId 為 null 的使用者訪問頁面，isOwnPage 永遠為 false（功能單元不顯示）。可接受，此類使用者應被導向 /profile。

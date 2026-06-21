## Why

課程詳情頁（`/course/[id]`）常透過分享連結（複製邀請連結）傳給尚未登入的人。目前未登入者一連到此頁，會被 middleware 與 `(user)` layout 直接靜默轉導到 `/login`，看不到任何說明，使用者不知道發生什麼事。應改為在課程頁本身顯示「無法檢視此課程，請先登入」的提示與登入按鈕。

## What Changes

- 未登入使用者存取 `/course/[id]` 時，**不再直接轉導 `/login`**，而是在課程頁顯示登入提示卡片：「🔒 無法檢視此課程 / 請先登入後再檢視課程內容」＋「前往登入」按鈕。
- 「前往登入」按鈕導向 `/login?callbackUrl=/course/[id]`，登入後返回原課程頁。
- 未登入時 SHALL NOT 顯示任何課程內容（標題、學員、FAQ 等），僅顯示提示卡片。
- 僅課程詳情頁（`/course/[id]`）開放此訪客提示；其子頁（如 `/course/[id]/graduate`）與其他 `(user)` 路由維持原有強制登入轉導。
- 已登入使用者的課程頁行為完全不變。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `course-session-detail`: 新增未登入訪客存取 `/course/[id]` 的行為 —— 顯示登入提示卡片（含前往登入按鈕、callbackUrl），不再被 middleware／layout 直接轉導，且不顯示課程內容。

## Impact

- `middleware.ts`：放行 `/course/[id]`（僅數字 id 的詳情頁，不含子路徑）通過，不做未登入轉導。
- `app/(user)/layout.tsx`：對 `/course/[id]` 訪客路徑改為渲染精簡版面（不轉導、不需 Topbar session），其餘 `(user)` 路由維持 `!userId → redirect('/login')`。
- `app/(user)/course/[id]/page.tsx`：未登入（`auth()` 無 session）時提前回傳登入提示卡片。
- 可能新增小元件：課程頁登入提示卡片。
- `config/version.json` patch +1；依 CLAUDE.md 第 9 點檢查手冊（屬訪客提示，預期無實質流程異動，仍需確認）。

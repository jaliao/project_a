## 1. 共用判定

- [x] 1.1 定義「課程詳情頁訪客可達」判定 `^/course/\d+$`（middleware 與 layout 共用同一正規式，確保一致）

## 2. Middleware

- [x] 2.1 `middleware.ts`：在 `isPublic` 之外新增判斷，路徑符合 `^/course/\d+$` 時放行（不做未登入 session cookie 轉導），其餘流程不變（仍設 `x-pathname`）
- [x] 2.2 確認子路徑（`/course/123/graduate`）與非數字 id 不符合，維持原強制登入轉導

## 3. (user) Layout

- [x] 3.1 `app/(user)/layout.tsx`：取得 `x-pathname`，當 `!userId` 且路徑符合 `^/course/\d+$` 時不 `redirect('/login')`，改渲染不含 `Topbar` 的精簡容器包住 `children`
- [x] 3.2 其餘 `!userId` 情境維持 `redirect('/login')`；已登入流程（onboarding／profile 守衛、Topbar）完全不變

## 4. 課程頁登入提示

- [x] 4.1 新增課程頁登入提示卡片元件（🔒 無法檢視此課程／請先登入後再檢視課程內容＋「前往登入」按鈕，`next/link` href=`/login?callbackUrl=/course/[id]`）
- [x] 4.2 `app/(user)/course/[id]/page.tsx`：`auth()` 後若無 session 提前 `return` 提示卡片，不再往下查詢 FAQ／統計等

## 5. 驗證

- [x] 5.1 `npm run build` 通過（tsc 無錯誤）
- [x] 5.2 未登入存取 `/course/[id]`：顯示提示卡片、不轉導、不顯示課程內容
- [x] 5.3 點「前往登入」→ `/login?callbackUrl=/course/[id]`，登入後返回該課程頁
- [x] 5.4 未登入存取 `/course/[id]/graduate` 與其他 `(user)` 頁：仍轉導 `/login`
- [x] 5.5 已登入存取 `/course/[id]`：完整內容與 Topbar、角色操作區塊不變（已登入程式路徑未更動，僅在無 session 時提前 return；build 通過）

## 6. 收尾

- [x] 6.1 依 CLAUDE.md 第 9 點檢查 `doc/` 手冊：本變更為未登入訪客提示，無既有登入流程／按鈕／權限／路由異動 → 無需更新
- [x] 6.2 apply 時將 `config/version.json` patch 版本號 +1（0.1.81 → 0.1.82）

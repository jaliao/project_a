## 1. Layout Guard 實作

- [x] 1.1 在 `app/(user)/layout.tsx` 引入 `headers` 或改用 `pathname` 取得目前路徑（透過 `headers()` 讀取 `x-invoke-path` 或傳入 `usePathname` 替代方案，建議直接在 layout 接收 `headers()` 取得 pathname）
- [x] 1.2 在 layout 新增 Prisma 查詢（與 `getUnreadNotificationCount` 並行），查詢已登入 user 的 `realName`、`phone`、`spiritId` 欄位
- [x] 1.3 實作 guard 邏輯：讀取 `process.env.REQUIRE_PROFILE_COMPLETION`（預設 true），若啟用且 `realName`/`phone` 任一缺失，且 `spiritId` 不為 null，且目前路徑不包含 `/profile`，則 `redirect('/user/${spiritId.toLowerCase()}/profile?incomplete=1')`

## 2. Profile 頁提示訊息

- [x] 2.1 在 `app/(user)/user/[spiritId]/profile/page.tsx` 新增 `searchParams: Promise<{ incomplete?: string }>` 參數，await 取得後判斷 `incomplete === '1'`
- [x] 2.2 當 `incomplete=1` 時，在頁面頂部（`<h1>` 之前）顯示藍色/強調提示框：「請先填寫必要資料（真實姓名、手機號碼），才能繼續使用系統。」

## 3. Dashboard Banner 條件控制

- [x] 3.1 在 `app/(user)/user/[spiritId]/page.tsx` 讀取 `process.env.REQUIRE_PROFILE_COMPLETION`，當其為 `'false'` 時才傳入並渲染 `<ProfileBanner>`；啟用時隱藏 Banner（因 layout 已轉導）

## 4. 環境變數設定

- [x] 4.1 在 `.env.example` 新增 `REQUIRE_PROFILE_COMPLETION=true` 並加上說明註解

## 5. 版本與文件

- [x] 5.1 `config/version.json` patch 版本號 +1
- [x] 5.2 依 `.ai-rules.md` 更新 `README-AI.md`

## 1. Layout 基礎建設

- [x] 1.1 建立 `app/(user)/layout.tsx`，包裝 `{children}` 並渲染 Topbar
- [x] 1.2 確認 `app/(user)/profile/` 路由在新 layout 下正常運作

## 2. Topbar 元件

- [x] 2.1 建立 `components/layout/topbar.tsx`（Server Component 殼 + Client 互動部分）
- [x] 2.2 加入系統標題文字（「啟動靈人系統」）
- [x] 2.3 加入「新增課程」按鈕（Tabler Icon + 文字），onClick 為預留佔位
- [x] 2.4 加入「個人資料」圖示按鈕，點擊導向 `/profile`
- [x] 2.5 加入「訊息」圖示按鈕，無 Badge（未讀數 0 不顯示角標），onClick 為預留佔位
- [x] 2.6 Topbar 樣式對齊 shadcn/ui Dashboard 範例風格（border-b、h-16、px-4）

## 3. 登入後預設重定向

- [x] 3.1 修改 `lib/auth.ts` 的 `redirect` 設定，登入後無 `callbackUrl` 時預設導向 `/dashboard`
- [x] 3.2 新增 `app/page.tsx`：未登入由 middleware 導向 `/login`，已登入 redirect 至 `/dashboard`

## 4. Dashboard 首頁

- [x] 4.1 建立 `app/(user)/dashboard/page.tsx`（Server Component），加入頁面標題
- [x] 4.2 建立 `components/dashboard/stats-card.tsx`，props: `icon`、`value`、`title`
- [x] 4.3 在 dashboard page 查詢統計資料（會員總數、本月新增、活躍會員）並傳入 StatsCard
- [x] 4.4 建立 `components/dashboard/recent-members.tsx`，顯示最近 10 筆會員記錄（名稱、Email、加入時間相對格式）
- [x] 4.5 在 dashboard page 查詢最新 10 筆 User（依 `createdAt` 降冪），傳入 RecentMembers
- [x] 4.6 實作空狀態：無會員記錄時顯示「尚無活動記錄」

## 5. 版本與文件

- [x] 5.1 更新 `config/version.json` patch 版本號 +1
- [x] 5.2 依 `.ai-rules.md` 規範更新 `README-AI.md`

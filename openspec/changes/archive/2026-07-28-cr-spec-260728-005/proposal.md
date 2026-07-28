## Why

後台「證書製作」頁（`/admin/certificates`）目前僅提供「上一頁／下一頁」翻頁，符合條件的證書筆數多時（每頁 30 筆），管理者要看到後段頁面必須逐頁點擊，無法直接跳到指定頁碼，操作效率低。

## What Changes

- `/admin/certificates` 的分頁 UI 由「上一頁／下一頁」改為**頁碼按鈕**（`1 2 [3] 4 5 ... 12`，頁數多時以省略號收合），可直接點擊任一頁碼跳頁；同時保留上一頁／下一頁箭頭按鈕。
- 新增 shadcn `Pagination` 元件（`components/ui/pagination.tsx`，目前專案尚未加入此元件）。
- 資料層 `getCertificateProductionList`（`lib/data/certificate.ts`）已回傳精確的 `total`／`totalPages`，**不需修改**，純 UI 層改動。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `admin-certificate-production`：「人名搜尋與分頁」需求的翻頁方式由上一頁/下一頁，明確化為可任意跳頁的頁碼按鈕

## Impact

- `app/[locale]/(admin)/admin/certificates/page.tsx`：分頁區塊（現行 137-171 行）改用新的 `Pagination` 元件渲染頁碼按鈕。
- 新增 `components/ui/pagination.tsx`（shadcn 元件）。
- 僅限證書製作頁，不影響推薦講師、會員管理、通知等其他仍為上一頁/下一頁的頁面。
- 無資料庫、API、驗證邏輯變更，無 migration。

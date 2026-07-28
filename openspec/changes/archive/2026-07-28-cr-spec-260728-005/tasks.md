## 1. 新增分頁元件

- [x] 1.1 執行 `npx shadcn add pagination`（或等效方式）新增 `components/ui/pagination.tsx`（並將內部 `PaginationLink` 由純 `<a>` 改為 `next/link` 的 `Link`，與本專案既有導航模式一致，避免整頁重新載入）

## 2. 頁碼視窗邏輯

- [x] 2.1 新增 `getPaginationRange(current, total)` helper：總頁數 ≤ 7 回傳全部頁碼；超過 7 時回傳 `1、目前頁-1、目前頁、目前頁+1、'ellipsis'、最後一頁`（依邊界情況調整，頭尾不重複、不多餘顯示省略號）

## 3. 頁面改動

- [x] 3.1 `app/[locale]/(admin)/admin/certificates/page.tsx` 匯入 shadcn `Pagination`／`PaginationContent`／`PaginationItem`／`PaginationLink`／`PaginationPrevious`／`PaginationNext`／`PaginationEllipsis`
- [x] 3.2 將現行 137-171 行的上一頁/下一頁區塊，改為 `Pagination` 元件：`PaginationPrevious`／`PaginationNext` 沿用既有停用邏輯（`result.page > 1` / `result.page < result.totalPages`，停用時 `aria-disabled` + `pointer-events-none opacity-50`）與 `qs(p)`；中間以 `getPaginationRange` 產生的頁碼陣列渲染 `PaginationLink`（`isActive` 標示目前頁）與 `PaginationEllipsis`
- [x] 3.3 保留原本「第 X / Y 頁・共 Z 筆」文字說明

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit`、`npm run lint` 通過
- [x] 4.2 於瀏覽器測試邊界情境：總頁數超過 7 頁且目前頁在中段（實測 24 頁，第 12 頁正確顯示 `1 … 11 [12] 13 … 24`）、第 1 頁上一頁正確停用（`aria-disabled=true`）、最後一頁下一頁正確停用（`aria-disabled=true`）
- [x] 4.3 點擊非當前頁碼（第 12 頁點「1」）確認正確跳轉且無整頁重新載入；暗色模式下頁碼、省略號、目前頁標示皆清楚可辨

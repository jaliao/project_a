## Context

`/admin/certificates`（`app/[locale]/(admin)/admin/certificates/page.tsx`）是純 server component，翻頁狀態存在 URL search param `page`，透過 `qs(p)` helper（55-61 行）產生查詢字串、以 `<Link href={qs(p)}>` 觸發整頁導航。資料層 `getCertificateProductionList`（`lib/data/certificate.ts:174-179`）已回傳精確 `total`／`totalPages`，換頁不需資料層改動。專案尚未加入 shadcn `Pagination` 元件（`components/ui/pagination.tsx` 不存在）。

## Goals / Non-Goals

**Goals:**
- 分頁區塊改用頁碼按鈕，可直接點擊任一頁碼跳頁；頁數多時以省略號收合（`1 2 [3] 4 5 ... 12`）。
- 保留現有上一頁／下一頁箭頭。
- 維持現行 server component + URL search param 的翻頁機制（不改為 client-side state）。

**Non-Goals:**
- 不修改資料層（`getCertificateProductionList`）。
- 不套用到推薦講師、會員管理、通知等其他頁面。
- 不新增頁碼輸入框（採頁碼按鈕，非輸入跳頁）。

## Decisions

- **新增 shadcn `Pagination` 元件**（`components/ui/pagination.tsx`，經 `npx shadcn add pagination` 加入）：`PaginationLink`／`PaginationPrevious`／`PaginationNext` 本質為標準 `<a>` 樣式元件，可直接傳入 `href`，與現行 `<Link href={qs(p)}>` 的 server-render 導航模式相容，不需將頁面改為 client component。
- **頁碼視窗演算法**：新增小型 helper `getPaginationRange(current, total)`（放在 `page.tsx` 內或抽到 `lib/utils.ts`，視程式碼長度決定），規則：永遠顯示第 1 頁與最後一頁；顯示當前頁 ±1；其餘以單一 `'ellipsis'` 標記表示省略區間（連續省略只顯示一個 `...`，不逐頁列出）。頁數 ≤ 7 時直接列出全部頁碼、不省略。
- **沿用既有 `qs(p)` 產生查詢字串**，頁碼按鈕的 `href` 一律呼叫 `qs(p)`，維持 status／搜尋關鍵字在換頁時保留的既有行為不變。
- **當前頁樣式**：`PaginationLink isActive` 標示當前頁碼（shadcn 元件內建 `isActive` prop 樣式）。

## Risks / Trade-offs

- [風險] 頁碼視窗演算法為新寫的邏輯，若邊界條件（頁數剛好等於視窗大小、當前頁在頭尾）處理不當可能顯示錯誤 → Mitigation：以總頁數 1、2、7（剛好不省略）、8（開始省略）、當前頁為第 1/最後一頁等邊界情境於瀏覽器手動驗證。
- [風險] shadcn `Pagination` 元件為新加入依賴，需確認其樣式與現有 `Button`／深色模式相容 → Mitigation：加入後直接於本頁面驗證亮暗色皆正常顯示。

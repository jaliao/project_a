## 1. 資料層

- [x] 1.1 `lib/data/support-inquiry.ts`：拆出共用內部 helper（`where` 條件建構、row → `InquiryListItem` 映射邏輯），供既有 `getInquiryList` 與新函式共用，避免重複程式碼
- [x] 1.2 新增 `INQUIRY_PAGE_SIZE = 20` 常數
- [x] 1.3 新增 `getPaginatedInquiryList(opts: { status?: SupportInquiryStatus | 'all'; page?: number }): Promise<{ items: InquiryListItem[]; total: number; page: number; pageCount: number }>`，比照 `lib/data/members.ts` 的 `searchMembers` 分頁邏輯（`count` → `pageCount` → `safePage` → `skip`/`take`）
- [x] 1.4 確認既有 `getInquiryList(opts: { status?, userId? })` 簽章與行為不變（供 `admin/members/[id]/page.tsx` 繼續使用）

## 2. 頁面整合

- [x] 2.1 `app/[locale]/(admin)/admin/support-inquiries/page.tsx`：`searchParams` 新增 `page?: string`，解析為 `Math.max(1, Number(sp.page) || 1)`
- [x] 2.2 改用 `getPaginatedInquiryList({ status, page })` 取代 `getInquiryList({ status })`
- [x] 2.3 新增分頁 UI：比照 `app/[locale]/(admin)/admin/certificates/page.tsx` 的 `getPaginationRange` helper 與 `<Pagination>`／`<PaginationContent>`／`<PaginationItem>`／`<PaginationLink>`／`<PaginationPrevious>`／`<PaginationNext>`／`<PaginationEllipsis>`（`components/ui/pagination.tsx`），`qs(p)` helper 需保留目前 `status` 於查詢字串
- [x] 2.4 總頁數 > 1 時才顯示分頁導航；顯示「第 X / Y 頁・共 N 筆」文字（沿用 certificates 頁樣式，admin 後台頁面維持既有繁體字面）

## 3. 驗證

- [x] 3.1 `npm run lint`
- [x] 3.2 `npm run build`
- [x] 3.3 於本機 dev DB 驗證：以 Prisma 直接查詢確認 `getPaginatedInquiryList` 分頁邊界正確（`skip`/`take`、`pageCount` 計算、`page` 超出範圍時夾在有效區間內）——已驗證：暫時插入 25 筆測試資料（共 27 筆 pending），page=1 回傳 20 筆／page=2 回傳 7 筆／page=99 與 page=0／page=-5 皆正確 clamp 至有效範圍（1～pageCount），驗證後已清除測試資料恢復原狀
- [x] 3.4 手動確認 `admin/members/[id]/page.tsx` 內嵌提問區塊行為未變動（呼叫端未修改、型別不變）——已確認呼叫端程式碼未變動（`getInquiryList({ userId, status: 'all' })`），並實際執行 `getInquiryList` 確認仍回傳未分頁的完整陣列

## 4. 文件與版本號同步

- [x] 4.1 檢查 `doc/管理者操作手冊.md` 提問管理章節是否需補充分頁說明（若無實質行為描述缺口可不修改，並於本任務註記原因）——已於「清單與狀態」段落新增分頁說明（每頁 20 筆、分頁導航、切換分頁籤回到第 1 頁）
- [x] 4.2 `config/version.json` patch 版號 +1，`updatedAt` 更新為當日日期

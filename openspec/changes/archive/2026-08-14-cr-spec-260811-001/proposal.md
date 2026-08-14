## Why

後台「提問管理」頁面（`/admin/support-inquiries`）目前無分頁機制，`getInquiryList()` 一次撈出符合狀態篩選的**全部**提問並整頁渲染。使用者於正式環境 `?status=replied`（已回覆分頁）反映清單過長、需要分頁。查核程式碼確認 `lib/data/support-inquiry.ts` 的 `getInquiryList` 對 `SupportInquiry` 資料表無 `take`/`skip` 限制，隨已回覆提問累積會持續變長，需補上分頁。

## What Changes

- 後台提問管理頁（`app/[locale]/(admin)/admin/support-inquiries/page.tsx`）新增分頁：每頁 20 筆，於三個狀態分頁籤（待處理／已回覆／全部）下皆適用；切換分頁籤時重置回第 1 頁。
- 分頁 UI 比照既有 `/admin/certificates` 頁面的既定樣式（`components/ui/pagination.tsx`：上一頁／頁碼／省略號／下一頁，皆為 `<Link href>` 伺服器端導航，不需額外 client component）。
- `lib/data/support-inquiry.ts` 新增 `getPaginatedInquiryList(opts: { status, page })`，回傳 `{ items, total, page, pageCount }`（分頁邏輯與回傳形狀比照既有 `searchMembers`／`getCertificateProductionList`），內部沿用原 `getInquiryList` 的 `where` 條件與逐筆映射邏輯（拆出共用內部函式，避免重複程式碼）。
- **既有 `getInquiryList(opts: { status, userId })` 維持不變**，供 `app/[locale]/(admin)/admin/members/[id]/page.tsx`（單一會員詳情頁內嵌「該會員全部提問」區塊）繼續使用——該處為單一會員的提問數量，資料量小，不需要分頁，本次不變動。

## Capabilities

### New Capabilities
（無，擴充既有 capability）

### Modified Capabilities
- `admin-inquiry-management`：新增「後台提問管理列表分頁」需求。

## Impact

- **Affected code**：
  - `lib/data/support-inquiry.ts`（新增 `getPaginatedInquiryList`，拆出共用映射函式；`getInquiryList` 簽章與行為不變）
  - `app/[locale]/(admin)/admin/support-inquiries/page.tsx`（改用 `getPaginatedInquiryList`，新增 `page` searchParam 與分頁 UI）
- **Database**：無 schema 變更。
- **Docs**：依 CLAUDE.md 第 9 點檢查 `doc/管理者操作手冊.md` 提問管理章節是否需補充分頁說明。
- **Dependencies**：無新增套件（沿用既有 `components/ui/pagination.tsx`）。

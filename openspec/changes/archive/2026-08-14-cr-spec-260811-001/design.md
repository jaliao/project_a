## Context

`getInquiryList(opts: { status?, userId? })`（`lib/data/support-inquiry.ts`）目前有兩個呼叫端：
1. `app/[locale]/(admin)/admin/support-inquiries/page.tsx`——後台提問管理主列表（本次要加分頁的目標，帶 `status`，不帶 `userId`）。
2. `app/[locale]/(admin)/admin/members/[id]/page.tsx`——會員詳情頁內嵌「該會員全部提問」區塊（帶 `userId` 與 `status: 'all'`），單一會員的提問數量天生有限，不是本次「清單過長」問題的來源。

專案既有兩種分頁實作先例：
- `lib/data/members.ts` 的 `searchMembers`：DB 層 `skip`/`take`，回傳 `{ total, items, page, pageCount }`，搭配 `MembersPagination`（client component，`router.push` 換頁）。
- `lib/data/certificate.ts` 的 `getCertificateProductionList`：因需先在記憶體聚合再分頁，回傳同形狀 `{ items, total, totalPages, page, pageSize }`，搭配 `/admin/certificates/page.tsx` 內建的 `<Pagination>`（`components/ui/pagination.tsx` shadcn 元件，伺服器端 `<Link href>` 導航，無 client component）。

提問管理列表是單純的 `SupportInquiry.findMany` 查詢（無需先聚合），適合直接在 DB 層 `skip`/`take`，形狀比照 `searchMembers`；但既有頁面本身已用 `<Link href={...}>` 做狀態分頁籤（伺服器端渲染、無 `'use client'`），故分頁 UI 沿用 `certificates/page.tsx` 的 `<Pagination>` 位址列模式，維持整頁伺服器端渲染的一致性，不引入新的 client component。

## Goals / Non-Goals

**Goals:**
- 後台提問管理主列表分頁，避免已回覆等分頁籤資料量成長後整頁一次渲染過長。
- 分頁邏輯與既有 `searchMembers` 一致（DB 層 `skip`/`take`），UI 與既有 `certificates` 頁一致（`<Pagination>` 位址列元件）。

**Non-Goals:**
- 不變動 `getInquiryList` 既有簽章與行為（會員詳情頁內嵌區塊不受影響、不分頁）。
- 不新增分頁大小設定選項（寫死每頁 20 筆，比照既有頁面皆為寫死常數，非使用者可調）。
- 不變更提問卡片本身內容與回覆互動邏輯。

## Decisions

1. **新增 `getPaginatedInquiryList`，不修改 `getInquiryList` 簽章**
   若直接在 `getInquiryList` 加上可選 `page` 參數並依是否傳入切換回傳形狀（陣列 vs 分頁物件），呼叫端型別會變得條件化、不易推導。兩個呼叫端需求本質不同（一個要分頁物件、一個要全量陣列），拆成兩個函式更清楚，且不影響會員詳情頁既有呼叫。

2. **拆出共用內部函式處理 `where` 建構與逐筆映射**
   兩個查詢函式的 `select` 欄位與 row → `InquiryListItem` 映射邏輯完全相同，僅差在是否 `skip`/`take` 與是否需要 `count`。拆出私有 helper（如 `buildInquiryWhere`／`mapInquiryRow`）供兩者共用，避免複製貼上。

3. **PAGE_SIZE = 20**
   提問卡片為單欄堆疊版面（比 `certificates` 的多欄卡片網格、`members` 的緊湊表格列都更佔垂直空間），20 筆比 30 筆更適合避免單頁過長；沿用既有「模組內常數」慣例（如 `MEMBER_PAGE_SIZE`），於 `support-inquiry.ts` 內定義 `INQUIRY_PAGE_SIZE = 20`。

4. **切換狀態分頁籤時重置回第 1 頁**
   狀態分頁籤連結（`?status=xxx`）目前不帶 `page` 參數；不主動處理即等同「切換分頁籤時 page 參數消失、預設回第 1 頁」，故不需要額外程式碼特別處理重置邏輯——只要 `page` 讀取邏輯以「未帶入視為 1」為預設即可自然達成。

## Risks / Trade-offs

- **[風險] 分頁後跳轉頁碼時，若該頁筆數因並發回覆操作而變化，可能出現頁碼輕微跳動** → 可接受：與既有 `certificates`／`members` 分頁頁面相同的既有限制，非本次新增風險。

## Migration Plan

1. `lib/data/support-inquiry.ts`：拆出共用 helper，新增 `getPaginatedInquiryList`。
2. `app/[locale]/(admin)/admin/support-inquiries/page.tsx`：改用新函式、新增 `page` searchParam 解析與 `<Pagination>` UI（比照 `certificates/page.tsx` 的 `getPaginationRange` 與 `qs()` helper）。
3. `npm run lint` + `npm run build`。
4. 檢查 `doc/管理者操作手冊.md` 提問管理章節是否需補充說明；`config/version.json` patch 版號 +1。

**Rollback：** 純程式碼變更（無 schema/migration），revert commit 即可還原。

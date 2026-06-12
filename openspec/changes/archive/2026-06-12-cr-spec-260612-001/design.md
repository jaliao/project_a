## Context

`/admin/members`（Server Component，`force-dynamic`）以 `searchMembers(q)` 撈出**所有**符合會員並全部渲染；資料達 1361 筆後渲染變慢。篩選僅有文字搜尋（`MemberSearchInput`，debounce 300ms → `?q=`）。匯出 `/api/admin/members/export` 與 `exportMembers(q)` 僅吃 `q`。`User` 具 `gender`/`roles`/`churchId`/`churchType`；教會清單可由 `getActiveChurches()` 取得。

## Goals / Non-Goals

**Goals:**
- 無任何搜尋／篩選條件時不查詢、不列清單。
- 有條件時每頁 30 筆並支援翻頁。
- 新增性別／身分／所屬教會下拉篩選，與文字搜尋 AND 組合。
- 匯出尊重所有篩選；「匯出 N 筆」= 符合條件總數。

**Non-Goals:**
- 不做無限捲動／游標分頁（採 offset 分頁即可）。
- 不改 DB schema、不加索引（資料量小，查詢已快）。
- 不改會員詳情頁。

## Decisions

### 1. 條件判定與 where 建構（lib/data/members.ts）
- `type MemberFilters = { q?: string; gender?: Gender; role?: UserRole; church?: string }`，其中 `church` 為 `churchId` 數字字串、或 `'other'`、`'none'`。
- `buildMemberWhere(f)`：組 AND 條件
  - `q` → 既有 OR（realName/name/nickname/email/spiritId, contains, insensitive）。
  - `gender` → `{ gender }`。
  - `role` → `{ roles: { has: role } }`（包含該身分即符合）。
  - `church` → 數字 → `{ churchId: Number }`；`'other'` → `{ churchType: 'other' }`；`'none'` → `{ churchType: 'none' }`。
- `hasAnyFilter(f)`：任一條件有值則 true。

### 2. searchMembers 分頁
- 簽章 `searchMembers(f: MemberFilters, page: number)` 回傳 `{ total, items, page, pageCount }`。
- `PAGE_SIZE = 30`；`skip=(page-1)*30, take:30`；`total = count(where)`；`pageCount = max(1, ceil(total/30))`；page 夾在 `[1, pageCount]`。
- 排序沿用 `[{ createdAt: 'desc' }, { realName: 'asc' }]`。

### 3. exportMembers
- 改吃 `MemberFilters`（不分頁），沿用 `buildMemberWhere`。

### 4. 頁面行為（app/(user)/admin/members/page.tsx）
- 解析 searchParams：`q`/`gender`/`role`/`church`/`page`。
- `hasAnyFilter` 為 false → 不呼叫 `searchMembers`，渲染提示「請輸入搜尋或選擇篩選條件以顯示會員」；匯出區仍保留「匯出全部」。
- 為 true → 顯示「共 {total} 筆，第 {page} / {pageCount} 頁」、表格（≤30 列）、翻頁控制；「匯出 {total} 筆」連結帶全部篩選參數。

### 5. 篩選 UI（client 元件）
- 新增 `members-filter.tsx`：文字搜尋（debounce 300ms）＋ 性別／身分／教會三個 `<select>`（沿用 course-sessions-filter 的 `<select>` 風格）。
- 任一變更 → 重建 URLSearchParams、**刪除 `page`（重置第 1 頁）**、`router.push`。
- 教會選項由頁面（Server）以 `getActiveChurches()` 取得後傳入；含「全部／各教會／其他／無」。
- 翻頁：`members-pagination.tsx`（上一頁／下一頁，保留其他參數、只改 `page`；邊界 disabled）。可改用連結式以維持 Server Component 導航。

### 6. Export API（app/api/admin/members/export/route.ts）
- 解析 `gender`/`role`/`church`（外加既有 `q`）→ 傳入 `exportMembers`。

## Risks / Trade-offs

- **offset 分頁**在極大資料量有 deep-paging 成本，但本系統規模（千級）無虞。
- **role 用 `has`**：選「講師」會含同時具其他身分者，符合「包含該身分」直覺。
- 變更篩選重置頁碼，避免停留在超出範圍的頁。

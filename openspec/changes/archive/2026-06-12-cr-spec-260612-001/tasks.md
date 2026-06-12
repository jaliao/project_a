## 1. 資料層（lib/data/members.ts）

- [x] 1.1 定義 `MemberFilters = { q?, gender?, role?, church? }` 與 `PAGE_SIZE = 30`
- [x] 1.2 抽出 `buildMemberWhere(f)`（q 的 OR + gender + roles.has(role) + church→churchId/other/none AND 組合）與 `hasAnyFilter(f)`
- [x] 1.3 `searchMembers(f, page)` 回傳 `{ total, items, page, pageCount }`：`count(where)` + `findMany({ where, skip:(page-1)*30, take:30, orderBy })`；page 夾在 `[1, pageCount]`
- [x] 1.4 `exportMembers(f)` 改吃 `MemberFilters`（沿用 `buildMemberWhere`，不分頁）

## 2. 篩選與翻頁元件

- [x] 2.1 新增 `members-filter.tsx`（client）：文字搜尋（debounce 300ms）+ 性別／身分／所屬教會 `<select>`；變更時更新 URL 參數並刪除 `page`（重置第 1 頁）；教會選項由 props 傳入（全部／各教會／其他／無）
- [x] 2.2 新增翻頁控制（上一頁／下一頁，保留其他參數只改 `page`，邊界 disabled）

## 3. 頁面整合（app/(user)/admin/members/page.tsx）

- [x] 3.1 解析 searchParams：`q`/`gender`/`role`/`church`/`page`；以 `getActiveChurches()` 取得教會選項傳入篩選列
- [x] 3.2 `hasAnyFilter` 為 false → 不查詢，顯示「請輸入搜尋或選擇篩選條件以顯示會員」提示（保留「匯出全部」）
- [x] 3.3 為 true → 呼叫 `searchMembers`，顯示「共 {total} 筆，第 {page} / {pageCount} 頁」、表格（≤30 列）、翻頁控制
- [x] 3.4 「匯出 {total} 筆」連結帶上所有篩選參數（q/gender/role/church）

## 4. 匯出 API（app/api/admin/members/export/route.ts）

- [x] 4.1 解析 `q`/`gender`/`role`/`church` 參數並傳入 `exportMembers`；非 admin 維持 401

## 5. 驗證

- [x] 5.1 `npm run build` 通過
- [x] 5.2 手動驗證：無條件不列清單；單一/多條件篩選正確；每頁 30 筆 + 翻頁；變更篩選回第 1 頁；匯出筆數=總數且內容符合篩選

## 6. 規範同步（依 CLAUDE.md）

- [x] 6.1 `config/version.json` patch +1
- [x] 6.2 重新產生 `README-AI.md`（會員管理篩選/分頁、任務日誌）
- [x] 6.3 更新 `doc/管理者操作手冊.md`〈會員管理〉章節（篩選、30 筆翻頁、無條件不列清單）

## Why

後台會員管理頁 `/admin/members` 目前以 `searchMembers(q)` 一次撈出**所有**符合條件的會員並全部渲染。資料量達 1361 筆後，頁面渲染明顯變慢。同時僅有文字搜尋，缺乏依性別／身分／所屬教會快速篩選的能力。

## What Changes

- **未下任何條件時不列出清單**：當 `q`／性別／身分／所屬教會皆未指定時，**不查詢、不渲染**會員清單，改顯示提示「請輸入搜尋或選擇篩選條件以顯示會員」。（兼顧效能：初始載入不再撈全表。）
- **分頁**：有條件時，清單**每頁 30 筆**並支援**翻頁**（上一頁／下一頁，以 `?page=` 控制；頁碼超出範圍時夾在有效區間）。
- 頁首顯示**符合條件的總筆數**與目前頁次（如「共 N 筆，第 X / Y 頁」）。
- **新增下拉篩選**（置於搜尋列上方／旁）：
  - **性別**（全部／男／女／未指定）
  - **身分**（全部／一般會員／講師／管理者／超級管理者）
  - **所屬教會**（全部／各教會／其他／無）
- 篩選與文字搜尋以 **AND** 組合，皆以 URL 參數傳遞（`?q=`、`?gender=`、`?role=`、`?church=`、`?page=`）；變更任一篩選時 `page` 重置為 1。
- **匯出**尊重目前所有篩選條件：「匯出 N 筆」之 N 為**符合條件的總筆數**（不受每頁 30 上限影響），匯出內容為符合條件的全部資料。

## Capabilities

### New Capabilities
<!-- 無新增能力 -->

### Modified Capabilities
- `admin-member-management`：新增「會員清單篩選與分頁」需求——下拉篩選（性別／身分／所屬教會）、與文字搜尋 AND 組合、未下任何條件時不列清單、有條件時每頁 30 筆並支援翻頁、顯示總數與頁次。
- `member-export`：匯出尊重新增的篩選條件；「匯出 N 筆」之數量以符合條件之總筆數計算。

## Impact

- **資料層** `lib/data/members.ts`：
  - 抽出共用 `buildMemberWhere({ q, gender, role, churchId, churchType })`（供 search/export 共用）；判斷「是否有任何條件」的 helper。
  - `searchMembers` 改回傳 `{ total, items }`，`items` 以 `skip:(page-1)*30, take:30` 分頁；新增 gender/role/church 條件。
  - `exportMembers` 接受相同篩選參數（不分頁）。
- **頁面** `app/(user)/admin/members/page.tsx`：讀取新 searchParams（含 `page`）；無條件時顯示提示不查清單；有條件時顯示總數 + 頁次 + 翻頁控制；匯出連結帶上篩選參數。
- **元件**：新增會員篩選列 client 元件（性別／身分／教會下拉 + 文字搜尋；更新 URL 參數並重置 `page=1`）；翻頁控制元件（上一頁／下一頁）。
- **API** `app/api/admin/members/export/route.ts`：解析 `gender`/`role`/`church` 參數並傳入 `exportMembers`。
- **教會選項**：沿用 `getActiveChurches()`（`lib/data/churches.ts`）。
- **無 DB schema 變更**（沿用 `User.gender`/`roles`/`churchId`/`churchType`）。
- 依專案規範：完成後 `config/version.json` patch +1、重產 `README-AI.md`、更新 `doc/管理者操作手冊.md`〈會員管理〉章節（篩選 + 50 筆上限）。

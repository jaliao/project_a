## Why

`app/[locale]/(admin)/admin/members/[id]/page.tsx:135` 的返回連結目前文字為「← 返回清單」，且 `href="/admin/members"` 未帶任何查詢參數。列表頁 `app/[locale]/(admin)/admin/members/page.tsx` 的搜尋/篩選（`q`、`gender`、`role`、`church`）與分頁（`page`）全部由 URL query 驅動（見 `admin-member-management` spec 之「會員清單篩選與分頁」Requirement）。管理者在列表頁輸入搜尋條件、翻頁後點進某筆會員詳情，目前點「返回清單」會回到未帶任何參數的 `/admin/members`，等同重置搜尋狀態，須重新輸入一次。

## What Changes

- 詳情頁返回連結文字由「← 返回清單」改為「← 返回會員管理」。
- 列表頁「查看詳情」連結（`page.tsx:135` 的 `/admin/members/${member.id}`）新增把目前的 `q`／`gender`／`role`／`church`／`page` 查詢參數一併帶給詳情頁；詳情頁再用這組參數組出「返回會員管理」連結的 `href`，使管理者返回時維持原本的搜尋/篩選/分頁狀態。
- 無任何查詢參數時（例如直接開啟詳情頁網址、或透過其他未帶參數的入口進入，如會員搜尋小工具 `member-tag.tsx`、重複帳號比對頁 `duplicate-candidate-row.tsx`、學習階層樹 `member-hierarchy-tree.tsx`），返回連結行為與現況一致，導回無參數的 `/admin/members`。

## Capabilities

### Modified Capabilities
- `admin-member-management`：「會員詳情頁」Requirement 新增「返回會員管理」連結文字與帶參數還原規則；「會員清單篩選與分頁」Requirement 新增「查看詳情」連結需帶出目前篩選查詢參數的規則。

## Impact

- **前端**：
  - `app/[locale]/(admin)/admin/members/[id]/page.tsx`（返回連結文字與 `href`，需讀取自身 `searchParams` 中轉來的篩選參數）
  - `app/[locale]/(admin)/admin/members/page.tsx`（「查看詳情」連結組出帶參數的 `href`）
- 不涉及資料庫 schema、Server Action 或資料查詢邏輯，純前端連結行為調整。
- 其他目前導向 `/admin/members/[id]` 但本身不帶列表篩選上下文的入口（重複帳號比對頁、會員搜尋小工具、學習階層樹、會員提問卡片）不在本次調整範圍，維持現狀導回無參數列表頁。

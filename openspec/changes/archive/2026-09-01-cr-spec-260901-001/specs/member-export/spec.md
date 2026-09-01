# member-export Delta（cr-spec-260901-001）

## ADDED Requirements

### Requirement: 未找回帳號名冊 Excel 匯出

管理者（admin／superadmin）SHALL 能在 `/admin/members` 頁面點擊「匯出未找回帳號」按鈕，下載一份 `.xlsx` 檔，內容為所有**登入 Email 仍為名冊 seed 合成網域 `@seed.iwillshare.org.tw`（不分大小寫）** 的會員——即尚未完成「找回帳號」流程、登入信箱未被替換的會員。此匯出範圍固定，SHALL NOT 受頁面目前的搜尋（`?q=`）或篩選（`?gender=`／`?role=`／`?church=`）條件影響。具講師身分（`teacher_1`／`teacher_2`／`teacher_3` 任一）的會員 SHALL 一併納入，並以「身分別」欄註記。

#### Scenario: 管理者點擊匯出未找回帳號

- **WHEN** admin／superadmin 在 `/admin/members` 點擊「匯出未找回帳號」
- **THEN** 瀏覽器下載 `unrecovered-members-YYYY-MM-DD.xlsx`，內容包含所有 `email` 以 `@seed.iwillshare.org.tw` 結尾的會員

#### Scenario: 已找回帳號者不列入

- **WHEN** 某會員曾完成找回帳號流程，`email` 已改為非 `@seed.iwillshare.org.tw` 的位址
- **THEN** 該會員不出現在匯出檔中

#### Scenario: 匯出不受頁面篩選影響

- **WHEN** 管理者在搜尋列輸入條件或選了性別／身分／教會篩選後，點擊「匯出未找回帳號」
- **THEN** 下載內容仍為全部未找回帳號的會員（忽略當前 `?q=`／`?gender=`／`?role=`／`?church=`）

#### Scenario: 具講師身分者以身分別註記

- **WHEN** 某未找回帳號會員的 `roles` 含 `teacher_1`／`teacher_2`／`teacher_3` 任一
- **THEN** 該列「身分別」欄為「講師」；否則為「學員」

---

### Requirement: 未找回帳號匯出欄位定義（8 欄）

匯出的 `.xlsx` 檔（工作表名「未找回帳號」）SHALL 依序包含以下 8 欄：啟動編號、真實姓名、Email、性別（中文化）、所屬教會、授課老師、身分別、講師編號。

#### Scenario: 啟動編號與真實姓名

- **WHEN** 匯出未找回帳號名冊
- **THEN** 「啟動編號」為會員 `spiritId`（無則空字串），「真實姓名」為 `realName`（無則空字串），資料列依 `spiritId` 遞增排序、`spiritId` 為空者殿後

#### Scenario: Email 欄

- **WHEN** 匯出未找回帳號名冊
- **THEN** 「Email」欄為該會員的登入 `email`（即合成信箱 `{spiritId}@seed.iwillshare.org.tw`）原字串

#### Scenario: 性別欄中文化

- **WHEN** 匯出未找回帳號名冊
- **THEN** `gender` 對應為：`male` → 男、`female` → 女、`unspecified`／null → 未指定

#### Scenario: 所屬教會欄組合

- **WHEN** 匯出未找回帳號名冊
- **THEN** 「所屬教會」優先顯示 `church.name`，其次 `churchOther`，最後 `churchType`，皆空則留空（與既有會員匯出的組法一致）

#### Scenario: 授課老師欄

- **WHEN** 某會員有一筆以上 `status = approved` 的課程報名（`InviteEnrollment`）
- **THEN** 「授課老師」欄列出這些報名對應課程（`CourseInvite`）建立者的姓名（優先真實姓名，缺則顯示名稱），去重、依出現順序、以頓號（`、`）分隔

#### Scenario: 無報名者授課老師欄留空

- **WHEN** 某會員無任何 `status = approved` 的報名
- **THEN** 「授課老師」欄為空字串

#### Scenario: 身分別欄

- **WHEN** 匯出未找回帳號名冊
- **THEN** 「身分別」欄：`roles` 含 `teacher_1`／`teacher_2`／`teacher_3` 任一 → 「講師」，否則 → 「學員」

#### Scenario: 講師編號欄

- **WHEN** 某未找回帳號會員的「身分別」為「講師」
- **THEN** 「講師編號」欄為其 `teacherNo`（無則空字串）

#### Scenario: 學員的講師編號欄留空

- **WHEN** 某未找回帳號會員的「身分別」為「學員」
- **THEN** 「講師編號」欄為空字串（即使該 `User` 因故有 `teacherNo` 值也不輸出）

---

### Requirement: 未找回帳號匯出 Route Handler（`GET /api/admin/members/unrecovered/export`）

系統 SHALL 提供 Route Handler 生成未找回帳號名冊 `.xlsx`。此 endpoint SHALL NOT 接受任何 query 參數（範圍固定為全部 `@seed.iwillshare.org.tw` 帳號）。非 admin／superadmin 或未登入的請求 SHALL 回傳 HTTP 401。

#### Scenario: 有效 admin 請求

- **WHEN** admin 呼叫 `GET /api/admin/members/unrecovered/export`
- **THEN** 回傳 `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`、`Content-Disposition: attachment; filename="unrecovered-members-YYYY-MM-DD.xlsx"`，內容為 8 欄未找回帳號名冊

#### Scenario: 未登入或非 admin 請求

- **WHEN** 未登入者或不具 admin／superadmin 身分者呼叫此 endpoint
- **THEN** 回傳 HTTP 401 Unauthorized，不產生檔案

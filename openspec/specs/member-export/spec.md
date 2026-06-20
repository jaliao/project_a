# member-export Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for member-export.

## Requirements

### Requirement: 會員 Excel 匯出（篩選）
管理者 SHALL 能在 `/admin/members` 頁面點擊「匯出 N 筆」按鈕，依目前**所有篩選條件**（`?q=` 文字搜尋、`?gender=`、`?role=`、`?church=`）匯出會員資料為 `.xlsx` 檔案下載。按鈕上的 N SHALL 反映**符合目前篩選條件的總筆數**（不受每頁 30 筆上限影響）。

#### Scenario: 帶搜尋條件匯出
- **WHEN** 管理者在搜尋列輸入條件後點擊「匯出 N 筆」
- **THEN** 瀏覽器下載 `members-YYYY-MM-DD.xlsx`，內容僅包含符合 `?q=` 條件的會員

#### Scenario: 帶下拉篩選匯出
- **WHEN** 管理者選擇性別／身分／教會等篩選後點擊「匯出 N 筆」
- **THEN** 下載的檔案內容僅包含符合全部篩選條件（AND）的會員

#### Scenario: 無任何條件時
- **WHEN** 未輸入搜尋且未選任何篩選
- **THEN** 不顯示會員清單；如需匯出全部會員，使用「匯出全部」按鈕

---

### Requirement: 會員 Excel 匯出（全部）
管理者 SHALL 能點擊「匯出全部」按鈕，忽略目前搜尋條件，匯出所有會員資料為 `.xlsx` 檔案下載。

#### Scenario: 忽略搜尋條件全部匯出
- **WHEN** 管理者點擊「匯出全部」（不論搜尋列是否有值）
- **THEN** 瀏覽器下載 `members-YYYY-MM-DD.xlsx`，內容包含所有會員（不套用 `?q=` 篩選）

---

### Requirement: 匯出 Route Handler（`GET /api/admin/members/export`）
系統 SHALL 提供 Route Handler 生成 `.xlsx` 檔案。`GET` 支援以 `q`、`gender`、`role`、`church` 參數篩選（AND 組合）；無任何參數時回傳全部。非 admin/superadmin 的請求 SHALL 回傳 401。

#### Scenario: 有效 admin 請求（帶篩選）
- **WHEN** admin 呼叫 `GET /api/admin/members/export?q=xxx&gender=female&role=teacher&church=3`
- **THEN** 回傳 `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`，`Content-Disposition: attachment; filename="members-YYYY-MM-DD.xlsx"`，內容為符合全部條件的會員資料

#### Scenario: 有效 admin 請求（全部）
- **WHEN** admin 呼叫 `GET /api/admin/members/export`（無參數）
- **THEN** 回傳包含所有會員的 `.xlsx` 檔案

#### Scenario: 未登入或非 admin 請求
- **WHEN** 非 admin 使用者或未登入者呼叫此 endpoint
- **THEN** 回傳 HTTP 401 Unauthorized

---

### Requirement: 匯出欄位定義（13 欄）
匯出的 `.xlsx` 檔案 SHALL 依序包含以下欄位：啟動編號、真實姓名、英文名稱、暱稱、Email、通訊Email、手機、性別（中文化）、角色（中文化）、所屬教會、學習等級、加入日期（YYYY/MM/DD）、最後登入（YYYY/MM/DD，空則留空）。

#### Scenario: 性別欄位中文化
- **WHEN** 匯出會員資料
- **THEN** `gender` 值對應為：`male` → 男、`female` → 女、`unspecified`/null → 未指定

#### Scenario: 角色欄位中文化
- **WHEN** 匯出會員資料
- **THEN** `role` 值對應為：`user` → 會員、`admin` → 管理員、`superadmin` → 超級管理員

#### Scenario: 所屬教會欄位組合
- **WHEN** 匯出會員資料
- **THEN** 所屬教會欄位優先顯示 `church.name`，其次 `churchOther`，最後 `churchType`，皆空則留空

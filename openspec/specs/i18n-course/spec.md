# i18n-course Specification

## Purpose
TBD - created by archiving change cr-spec-260629-008. Update Purpose after archive.
## Requirements
### Requirement: 課程頁在地化
課程頁（`course/[id]` 詳情、`course/[id]/graduate` 結業、`course-sessions` 查詢）的 UI 文案 SHALL 以 `course` 命名空間取用、隨當前語言呈現，不寫死語言字串；server 文案用 `getTranslations`、client 互動用 `useTranslations`，動態數值以 ICU 參數代入。

課程詳情頁「已核准學員」區塊的「新增學員」／「移除學員」按鈕、以及「課程操作 LOG」區塊（標題、空狀態文字、「顯示最近 N 筆・共 N 筆」說明）SHALL 一併以 `course` 命名空間在地化，SHALL NOT 硬編碼繁體字串。新增／移除學員 Dialog（`components/admin/invite-student-cells.tsx` 的 `AddStudentDialog`／`RemoveStudentButton`）於課程詳情頁使用情境下 SHALL 改接 `course` 命名空間。

#### Scenario: 課程詳情頁在地化
- **WHEN** 以非預設語言開啟課程詳情頁
- **THEN** 區塊標題、欄位標籤、按鈕、狀態說明、空狀態以該語言呈現；課程名/講師名等內容原樣顯示

#### Scenario: 結業表單頁在地化
- **WHEN** 以非預設語言開啟結業表單頁
- **THEN** 表單標題、步驟與按鈕以該語言呈現

#### Scenario: 新增／移除學員按鈕在地化
- **WHEN** 以英文模式開啟課程詳情頁「已核准學員」區塊
- **THEN** 「新增學員」「移除學員」按鈕文字顯示為對應英文

#### Scenario: 課程操作 LOG 區塊在地化
- **WHEN** 以英文模式開啟課程詳情頁「課程操作 LOG」區塊，且該課尚無操作紀錄
- **THEN** 區塊標題與空狀態文字顯示為對應英文，不含中文殘留

#### Scenario: 新增學員 Dialog 於課程頁情境在地化
- **WHEN** 該課講師或管理者於課程詳情頁點擊「新增學員」開啟 Dialog
- **THEN** Dialog 標題、欄位、按鈕、送出後 toast 以英文模式顯示對應英文

### Requirement: 課程元件在地化
`components/course-session`、`components/course-catalog` 的靜態 UI 文案 SHALL 以 i18n 取用。

（原一併列入的 `components/course-faq` 已隨課程 FAQ 功能下架而移除，不再適用——見 CR-SPEC-260828-004。）

#### Scenario: 課程卡與詳情元件在地化
- **WHEN** 以非預設語言檢視含課程卡或課程詳情子元件的頁面
- **THEN** 其靜態文字以該語言呈現

#### Scenario: 共用 schema 驗證不在本批
- **WHEN** 檢視使用與後台共用之 `course-*` schema 的表單（如開課精靈）
- **THEN** 其驗證訊息維持原狀（不 key 化），後台不受影響

#### Scenario: 教材申請對話框在地化
- **WHEN** 以非預設語言開啟老師/管理者的教材申請對話框（`material-order-dialog`）
- **THEN** Dialog 標題、取貨方式標籤、欄位標籤、按鈕文字以該語言呈現

### Requirement: 課程網域範圍邊界
本批 SHALL NOT 涵蓋 `components/course-invite`（邀請操作）；亦 SHALL NOT 在地化使用者產生內容與相對時間。未遷移處 SHALL 回退繁體。原排除之 `components/course-order`（教材訂購）死碼已於本批移除，不再需要在地化。

#### Scenario: 範圍外維持原狀
- **WHEN** 檢視邀請操作元件或內容資料
- **THEN** 維持繁體（內容）或留待後續批次，缺 key 回退繁體、不破版

#### Scenario: 課程詳情頁操作區塊全數在地化
- **WHEN** 以非預設語言開啟課程詳情頁，檢視教材申請、開始上課、結業、重新招募、取消上課各操作區塊
- **THEN** 各區塊標題、說明、確認視窗、按鈕文字皆以該語言呈現，無硬編碼繁體殘留（動作層 `message` 文案除外，依既有慣例維持原樣）


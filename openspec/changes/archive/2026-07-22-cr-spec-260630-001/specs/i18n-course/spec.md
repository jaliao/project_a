## MODIFIED Requirements

### Requirement: 課程元件在地化
`components/course-session`、`components/course-faq`、`components/course-catalog` 的靜態 UI 文案 SHALL 以 i18n 取用。

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

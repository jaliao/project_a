## MODIFIED Requirements

### Requirement: 我需要幫助按鈕
Topbar 右側操作按鈕群組 SHALL 包含「聯絡管理者」圖示按鈕，位於「訊息通知」按鈕左邊，所有已登入會員皆可見，點擊後導向個人專區「我的提問」頁面（不彈出對話框）。

#### Scenario: 顯示聯絡管理者按鈕
- **WHEN** 任何已登入會員檢視 Topbar
- **THEN** 右側按鈕群組於「訊息通知」按鈕左邊顯示「聯絡管理者」圖示按鈕（不需特定身分）

#### Scenario: 點擊聯絡管理者按鈕
- **WHEN** 會員點擊「聯絡管理者」按鈕
- **THEN** 導向 `/user/{spiritId}/inquiries` 頁面（見 `contact-admin` capability）

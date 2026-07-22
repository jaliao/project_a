## ADDED Requirements

### Requirement: 我需要幫助按鈕
Topbar 右側操作按鈕群組 SHALL 包含「我需要幫助」圖示按鈕，所有已登入會員皆可見，點擊後開啟聯繫管理者提問 Dialog。

#### Scenario: 顯示我需要幫助按鈕
- **WHEN** 任何已登入會員檢視 Topbar
- **THEN** 右側按鈕群組顯示「我需要幫助」圖示按鈕（不需特定身分）

#### Scenario: 點擊我需要幫助按鈕
- **WHEN** 會員點擊「我需要幫助」按鈕
- **THEN** 開啟聯繫管理者提問 Dialog（見 `contact-admin` capability）

## ADDED Requirements

### Requirement: 媒合布告欄按鈕
Topbar 右上角按鈕群組 SHALL 包含「媒合布告欄」按鈕（圖示），所有登入會員皆可見，點擊後導向媒合布告欄 `/match-board`。

#### Scenario: 顯示媒合布告欄按鈕
- **WHEN** 任何登入會員檢視 Topbar
- **THEN** 右上角顯示「媒合布告欄」按鈕（不需特定身分）

#### Scenario: 點擊前往布告欄
- **WHEN** 會員點擊「媒合布告欄」按鈕
- **THEN** 導向 `/match-board`

# topbar Delta（cr-spec-260829-002）

## ADDED Requirements

### Requirement: Topbar 我的學習入口

Topbar 的操作項目集合 SHALL 包含「我的學習」，桌機（水平圖示按鈕列）與手機（收合選單）皆呈現，位置一致（於「媒合布告欄」之後）。點擊「我的學習」SHALL 導向當前登入使用者的 `/user/{spiritId}/learning`。

「我的學習」項目 SHALL 對所有已登入使用者顯示（與「個人資料」「聯絡管理者」相同，不需特定身分），其文字 SHALL 以 i18n key（`nav.learning`）取用，SHALL NOT 於元件寫死中文。手機選單中該項目 SHALL 同時呈現圖示與文字標籤，整列可點擊；點擊後 SHALL 於導頁後關閉選單面板。

#### Scenario: 桌機顯示我的學習按鈕

- **WHEN** 已登入使用者在視窗寬度大於或等於 768px 檢視 Topbar
- **THEN** 水平按鈕列於「媒合布告欄」之後顯示「我的學習」圖示按鈕，點擊導向 `/user/{spiritId}/learning`

#### Scenario: 手機選單包含我的學習項目

- **WHEN** 已登入使用者在手機寬度開啟 Topbar「選單」
- **THEN** 選單清單於「媒合布告欄」之後含「我的學習」項目（圖示＋文字），點擊導向 `/user/{spiritId}/learning` 並關閉選單面板

#### Scenario: 所有登入者皆可見

- **WHEN** 任一已登入使用者（不論身分）檢視 Topbar
- **THEN** 「我的學習」入口存在（桌機按鈕列與手機選單）

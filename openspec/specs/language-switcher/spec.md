# language-switcher Specification

## Purpose
TBD - created by archiving change cr-spec-260629-004. Update Purpose after archive.
## Requirements
### Requirement: 語言切換器
系統 SHALL 提供語言切換 UI，列出支援語言（繁體中文／English／簡體中文），切換後 SHALL 保留使用者當前所在路徑、改以所選語言呈現，並記住其語言偏好（`NEXT_LOCALE` cookie）。切換器 SHALL 出現於 Topbar（登入後）與免登入頁。

#### Scenario: 切換語言保留當前路徑
- **WHEN** 使用者於某頁（如 `/dashboard`）以切換器選擇 English
- **THEN** 導向同頁的英文版本（如 `/en/dashboard`），停留在相同內容頁

#### Scenario: 記住語言偏好
- **WHEN** 使用者切換語言後再次造訪
- **THEN** 系統依其記住的偏好呈現該語言

#### Scenario: 顯示三種語言選項
- **WHEN** 使用者開啟語言切換器
- **THEN** 顯示繁體中文、English、簡體中文三個選項，並標示當前語言

#### Scenario: 免登入頁亦可切換
- **WHEN** 未登入使用者於登入頁開啟切換器
- **THEN** 可切換語言，登入頁以所選語言呈現


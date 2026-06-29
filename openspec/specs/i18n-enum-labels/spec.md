# i18n-enum-labels Specification

## Purpose
TBD - created by archiving change cr-spec-260629-006. Update Purpose after archive.
## Requirements
### Requirement: 共用標籤於 React 顯示以 i18n 呈現
共用 enum/狀態/身分/書別標籤在 **React 顯示**時 SHALL 以 i18n 命名空間（`status`/`role`/`catalog`）呈現、隨當前語言變動。涵蓋課程狀態徽章、書別徽章與前台身分標籤。

#### Scenario: 課程狀態徽章在地化
- **WHEN** 以非預設語言檢視含課程狀態徽章的頁面
- **THEN** 狀態文字（招生中/進行中/已結業）以該語言呈現

#### Scenario: 書別/身分標籤在地化
- **WHEN** 以非預設語言檢視書別徽章或前台身分標籤
- **THEN** 文字以該語言呈現

### Requirement: 非 React 情境保留標籤 map
非 React／無 i18n 情境（如 Excel 匯出路由）SHALL 保留既有標籤 map（如 `ROLE_LABELS`）以繁體輸出，不得改為 i18n key。

#### Scenario: Excel 匯出維持繁體標籤
- **WHEN** 管理者匯出會員 Excel
- **THEN** 身分等標籤以既有繁體 map 輸出，不受 React i18n 化影響


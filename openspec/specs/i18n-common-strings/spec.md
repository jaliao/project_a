# i18n-common-strings Specification

## Purpose
TBD - created by archiving change cr-spec-260629-006. Update Purpose after archive.
## Requirements
### Requirement: 共用字串命名空間與遷移
系統 SHALL 提供 `common`（通用動作：儲存/取消/刪除/確認/返回/載入中/搜尋…）與 `nav`（導覽）共用命名空間，跨域共用元件（側邊/導覽、共用按鈕、空狀態、toast）SHALL 以 key 取用、不寫死語言字串。feature 專屬元件之字串不在本批。

#### Scenario: 共用元件以 key 取用
- **WHEN** 跨域共用元件（如側邊/導覽、共用按鈕）顯示文字
- **THEN** 透過 `common`/`nav` key 取用並隨當前語言呈現

#### Scenario: 通用動作詞集中
- **WHEN** 多處需要「儲存/取消/刪除」等通用動作詞
- **THEN** 取用同一 `common.*` key，不各自寫死

#### Scenario: feature 專屬字串不在本批
- **WHEN** 檢視 course/admin 等 feature 專屬元件
- **THEN** 其字串維持原狀（留待對應批次），缺 key 回退繁體


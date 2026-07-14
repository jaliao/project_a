# admin-operation-log Delta（cr-spec-260714-003）

## REMOVED Requirements

### Requirement: 操作紀錄查詢頁
**移除原因**：後台 `/admin/operation-logs` 頁與 dashboard 功能格退場，查詢改由前台課程頁「課程操作 LOG」區塊承擔（見 `course-session-detail`），依課程過濾、對管理者與該課講師可見。

## MODIFIED Requirements

### Requirement: 管理操作紀錄寫入

系統 SHALL 以 `AdminActionLog` 模型記錄班級學員管理操作：每筆含動作（`enrollment_add`／`enrollment_remove`）、操作者（**管理者或該課講師**）、對象學員、班級之 optional 外鍵（皆 `onDelete: SetNull`），以及**文字快照**欄位（操作者姓名、對象學員姓名含 email、班級編號＋課程名稱）與摘要（如「補登結業 2025/09/01」「移除已結業報名」）、時間。紀錄寫入 SHALL 與對應操作在同一交易內完成；相關會員或班級日後被刪除時，紀錄 SHALL 仍保留且快照內容可讀。本能力範圍 SHALL 僅涵蓋班級學員新增／移除，SHALL NOT 回溯記錄其他既有後台操作。

#### Scenario: 新增學員寫入紀錄
- **WHEN** 管理者或該課講師成功對班級新增學員
- **THEN** 產生一筆 `enrollment_add` 紀錄，含操作者、對象、班級快照與摘要

#### Scenario: 移除學員寫入紀錄
- **WHEN** 管理者或該課講師成功自班級移除學員
- **THEN** 產生一筆 `enrollment_remove` 紀錄，含操作者、對象、班級快照與摘要

#### Scenario: 對象被刪除後紀錄仍可讀
- **WHEN** 某紀錄的對象學員（或班級）之後被刪除
- **THEN** 紀錄保留，外鍵設為 null，頁面仍以快照欄呈現完整資訊

#### Scenario: 操作失敗不留紀錄
- **WHEN** 新增／移除操作於交易中失敗回滾
- **THEN** 不產生操作紀錄

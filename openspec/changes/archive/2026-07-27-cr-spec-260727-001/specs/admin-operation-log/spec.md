## MODIFIED Requirements

### Requirement: 管理操作紀錄寫入

系統 SHALL 以 `AdminActionLog` 模型記錄下列管理操作：班級學員新增／移除（`enrollment_add`／`enrollment_remove`，操作者為管理者或該課講師）、會員刪除（`member_delete`，操作者為管理者）。每筆紀錄含動作、操作者、對象學員、班級之 optional 外鍵（皆 `onDelete: SetNull`），以及**文字快照**欄位（操作者姓名、對象學員姓名含 email、班級編號＋課程名稱——無課程情境之操作該欄位可為空）與摘要（如「補登結業 2025/09/01」「移除已結業報名」「刪除會員」）、時間。紀錄寫入 SHALL 與對應操作在同一交易內完成；相關會員或班級日後被刪除時，紀錄 SHALL 仍保留且快照內容可讀。

#### Scenario: 新增學員寫入紀錄
- **WHEN** 管理者或該課講師成功對班級新增學員
- **THEN** 產生一筆 `enrollment_add` 紀錄，含操作者、對象、班級快照與摘要

#### Scenario: 移除學員寫入紀錄
- **WHEN** 管理者或該課講師成功自班級移除學員
- **THEN** 產生一筆 `enrollment_remove` 紀錄，含操作者、對象、班級快照與摘要

#### Scenario: 會員刪除寫入紀錄
- **WHEN** 管理者成功執行會員刪除（`deleteMember`）
- **THEN** 產生一筆 `member_delete` 紀錄，含操作者與被刪除帳號之文字快照，班級相關欄位（`inviteId`／`inviteTitle`）為空

#### Scenario: 對象被刪除後紀錄仍可讀
- **WHEN** 某紀錄的對象學員（或班級）之後被刪除
- **THEN** 紀錄保留，外鍵設為 null，頁面仍以快照欄呈現完整資訊

#### Scenario: 操作失敗不留紀錄
- **WHEN** 新增／移除／刪除操作於交易中失敗回滾
- **THEN** 不產生操作紀錄

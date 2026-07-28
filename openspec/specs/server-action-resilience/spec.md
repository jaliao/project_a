# server-action-resilience Specification

## Purpose
TBD - created by archiving change cr-spec-260724-002. Update Purpose after archive.

## Requirements

### Requirement: 部署版本不符錯誤偵測
系統 SHALL 提供共用工具 `isDeploymentMismatchError(error)`，用以判斷一個錯誤是否為 Next.js Server Action 因正式環境重新部署造成的版本不符錯誤（錯誤訊息包含 `Failed to find Server Action` 與 `older or newer deployment` 字樣）。

#### Scenario: 判斷為版本不符錯誤
- **WHEN** 傳入的錯誤為 `Error` 且訊息符合 `Failed to find Server Action ... This request might be from an older or newer deployment` 格式
- **THEN** `isDeploymentMismatchError` 回傳 `true`

#### Scenario: 判斷為一般錯誤
- **WHEN** 傳入的錯誤訊息不符合上述格式（如驗證錯誤、網路逾時等一般錯誤）
- **THEN** `isDeploymentMismatchError` 回傳 `false`，呼叫端維持原有的一般錯誤處理邏輯

### Requirement: 版本不符時的使用者提示
呼叫 Server Action 的表單元件，若透過 `isDeploymentMismatchError` 判定發生部署版本不符，SHALL 顯示明確提示（文案走 i18n key，不寫死中文）告知使用者頁面已更新、需重新整理後才能再次操作，並提供可直接點擊執行重新整理的動作按鈕。

#### Scenario: 顯示版本不符提示
- **WHEN** 表單元件呼叫 Server Action 時因版本不符而拋出錯誤
- **THEN** 系統顯示提示訊息，並提供「重新整理」動作按鈕

#### Scenario: 點擊重新整理按鈕
- **WHEN** 使用者點擊提示中的「重新整理」按鈕
- **THEN** 瀏覽器頁面重新整理，載入最新版本

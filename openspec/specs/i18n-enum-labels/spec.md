# i18n-enum-labels Specification

## Purpose
TBD - created by archiving change cr-spec-260629-006. Update Purpose after archive.
## Requirements
### Requirement: 共用標籤於 React 顯示以 i18n 呈現
共用 enum/狀態/身分/書別標籤在 **React 顯示**時 SHALL 以 i18n 命名空間（`status`/`role`/`catalog`/`materialOrderStatus`/`adminLogAction`）呈現、隨當前語言變動。涵蓋課程狀態徽章、書別徽章、前台身分標籤、**教材訂單狀態標籤**、**管理操作紀錄的動作標籤（課程操作 LOG 區塊顯示用）**。

教材訂單狀態（`lib/utils/material-order-status.ts` 的 `MaterialOrderStatusKey`）與操作紀錄動作（`config/admin-log-action.ts` 的 `AdminLogAction`）SHALL 各提供對應 i18n key（命名空間 `materialOrderStatus`／`adminLogAction`，leaf 名稱採用其穩定識別碼，如 `materialOrderStatus.pending_payment`、`adminLogAction.enrollment_add`），React 顯示端 SHALL 透過 `t()` 取用、SHALL NOT 直接引用原始 `LABELS`／`label` 欄位字串。

#### Scenario: 課程狀態徽章在地化
- **WHEN** 以非預設語言檢視含課程狀態徽章的頁面
- **THEN** 狀態文字（招生中/進行中/已結業）以該語言呈現

#### Scenario: 書別/身分標籤在地化
- **WHEN** 以非預設語言檢視書別徽章或前台身分標籤
- **THEN** 文字以該語言呈現

#### Scenario: 教材訂單狀態標籤在地化
- **WHEN** 以英文模式檢視教材訂單卡片（課程頁或管理頁）
- **THEN** 狀態標籤（如「待付款」對應之 `pending_payment`）顯示為對應英文文字，非中文原字串

#### Scenario: 課程操作 LOG 動作標籤在地化
- **WHEN** 以英文模式檢視課程詳情頁「課程操作 LOG」區塊
- **THEN** 各紀錄之動作文字（如「新增學員」對應之 `enrollment_add`）顯示為對應英文文字

### Requirement: 非 React 情境與伺服端判斷訊息維持原 map
非 React／無 i18n 情境（如 Excel 匯出路由）SHALL 保留既有標籤 map（如 `ROLE_LABELS`、`material-order-status.ts` 的 `LABELS`、`ADMIN_LOG_ACTIONS` 的 `label`）以繁體輸出，不得改為 i18n key。`lib/utils/course-start-gate.ts` 回傳給 **Server Action 判斷邏輯／拒絕訊息**的 reasons 文案 SHALL 維持既有繁體字串不變；僅 **UI 顯示端**（如開課門檻提示 tooltip）另外透過對應 i18n key 呈現等價文字，兩者為獨立維護、SHALL NOT 共用同一段字串變數。

#### Scenario: Excel 匯出維持繁體標籤
- **WHEN** 管理者匯出會員 Excel
- **THEN** 身分等標籤以既有繁體 map 輸出，不受 React i18n 化影響

#### Scenario: 開課門檻 UI 提示在地化、server 判斷不受影響
- **WHEN** 以英文模式檢視教材訂單尚未全部收件的開課門檻提示
- **THEN** UI 顯示英文提示文字；`startCourseSession` Server Action 內部的門檻判斷邏輯與其拒絕訊息文案不變（仍為既有繁體字串）


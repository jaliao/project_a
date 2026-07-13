# admin-material-management Delta

## MODIFIED Requirements

### Requirement: 管理者批價與確認收款操作
管理頁 SHALL 依訂單付款狀態提供操作：狀態「待批價」顯示「批價」按鈕（開啟金額＋匯款帳號資訊對話框，帳號資訊欄為 textarea、預設帶入系統設定值），呼叫 `quoteMaterialOrder`；狀態「待確認收款」顯示老師回填的匯款後五碼與「確認收款」按鈕，呼叫 `confirmMaterialPayment`。管理頁狀態標籤 SHALL 涵蓋待批價／待付款／待確認收款／待寄送／已寄送／已收件。訂單詳情之「匯款帳號資訊」SHALL 保留換行呈現（`whitespace-pre-wrap` 或等效）。

#### Scenario: 待批價顯示批價按鈕
- **WHEN** 管理者檢視狀態為「待批價」的申請
- **THEN** 顯示「批價」按鈕，點擊開啟含金額與匯款帳號資訊（textarea，預設帶入 `remittance_account` 設定值）的對話框

#### Scenario: 待確認收款顯示後五碼與確認鈕
- **WHEN** 管理者檢視狀態為「待確認收款」的申請
- **THEN** 顯示老師回填的匯款後五碼與「確認收款」按鈕

#### Scenario: 狀態標籤涵蓋付款階段
- **WHEN** 管理者檢視教材申請列表
- **THEN** 每筆申請依推導顯示對應狀態標籤（待批價／待付款／待確認收款／待寄送／已寄送／已收件）

#### Scenario: 訂單詳情多行顯示匯款帳號資訊
- **WHEN** 管理者展開已批價訂單詳情
- **THEN** 「匯款帳號資訊」以保留換行的區塊呈現批價時的快照內容

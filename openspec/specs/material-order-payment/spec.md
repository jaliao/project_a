# material-order-payment Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for material-order-payment.
## Requirements
### Requirement: 教材訂單付款狀態
`CourseOrder` SHALL 以 nullable 時間戳與金額欄位表示付款進度：`quotedAmount`、`remittanceAccount`、`quotedAt`（批價）、`paymentLast5`、`paymentReportedAt`（老師回填）、`paymentConfirmedAt`（管理者確認收款）。系統 SHALL 提供單一狀態推導，供管理頁與課程頁共用。

#### Scenario: 狀態依時間戳推導
- **WHEN** 系統推導某訂單付款／寄送狀態
- **THEN** 依序為：`quotedAt` 為 null → 待批價；否則 `paymentReportedAt` 為 null → 待付款；否則 `paymentConfirmedAt` 為 null → 待確認收款；否則 `shippedAt` 為 null → 待寄送；否則 `receivedAt` 為 null → 已寄送；否則 → 已收件

### Requirement: 匯款帳號系統設定
系統 SHALL 於 `/admin/settings` 提供可設定的多行「匯款帳號資訊」（`AdminSetting` key `remittance_account`），輸入欄 SHALL 為 textarea 以支援多行文字，管理者（admin 與 superadmin）皆可設定。測試環境預設值 SHALL 為：

```
第一銀行淡水分行
戶名：希望之聲文化有限公司
銀行代碼：007
帳號：218-10-002087
```

批價表單的帳號資訊欄 SHALL 預設帶入此設定值。

#### Scenario: 預設匯款帳號資訊
- **WHEN** 尚未設定 `remittance_account` 時讀取設定
- **THEN** 回傳上述多行預設值（第一銀行淡水分行／戶名／銀行代碼／帳號四行）

#### Scenario: 管理者更新匯款帳號資訊
- **WHEN** 管理者（admin 或 superadmin）於 `/admin/settings` 以 textarea 儲存新的多行匯款帳號資訊
- **THEN** `AdminSetting` key `remittance_account` 更新為新值（保留換行），後續批價表單帶入新值

#### Scenario: 多行內容完整保存
- **WHEN** 管理者儲存含換行的匯款帳號資訊
- **THEN** 重新載入設定頁後 textarea 顯示原有換行格式，不被壓縮為單行

### Requirement: 管理者批價
系統 SHALL 提供 `quoteMaterialOrder(orderId, { amount, account })` Server Action，僅管理者可呼叫。SHALL 驗證 `amount` 為正整數、`account` trim 後非空（允許多行文字），寫入 `quotedAmount`、`remittanceAccount`（快照，保留換行）、`quotedAt`，並通知老師。通知訊息 SHALL 以換行附上完整匯款帳號資訊，不得行內拼接多行內容。

#### Scenario: 批價成功並通知老師
- **WHEN** 管理者對待批價訂單送出有效金額與帳號資訊
- **THEN** 寫入 `quotedAmount`、`remittanceAccount`、`quotedAt`，並以 `createNotification` 通知該課程老師，通知內文格式為「教材費用為 NT$X，請匯款至：」後接換行的完整匯款帳號資訊，末行提示回填後五碼，回傳 `{ success: true }`

#### Scenario: 金額無效
- **WHEN** 批價金額非正整數或帳號資訊為空
- **THEN** 回傳 `{ success: false }` 並提示欄位錯誤，不寫入批價資料

#### Scenario: 非管理者不可批價
- **WHEN** 非管理者呼叫 `quoteMaterialOrder`
- **THEN** 回傳 `{ success: false, message: '無權限' }`

### Requirement: 老師回填匯款後五碼
系統 SHALL 提供 `reportMaterialPayment(inviteId, last5)` Server Action，僅該課程老師（`CourseInvite.createdById`）可呼叫。SHALL 要求訂單已批價（`quotedAt` 非 null）、`last5` 為 5 位數字，寫入 `paymentLast5`、`paymentReportedAt`。

#### Scenario: 回填後五碼成功
- **WHEN** 老師於已批價訂單輸入 5 位數字後五碼並送出
- **THEN** 寫入 `paymentLast5`、`paymentReportedAt`，狀態進入「待確認收款」，回傳 `{ success: true }`

#### Scenario: 後五碼格式錯誤
- **WHEN** 輸入非 5 位數字
- **THEN** 回傳 `{ success: false }` 並提示格式錯誤，不寫入

#### Scenario: 尚未批價不可回填
- **WHEN** 訂單 `quotedAt` 為 null 時呼叫
- **THEN** 回傳 `{ success: false, message: '尚未批價' }`

#### Scenario: 非該課程老師不可回填
- **WHEN** 非 `CourseInvite.createdById` 的使用者呼叫
- **THEN** 回傳 `{ success: false, message: '無權限' }`

### Requirement: 管理者確認收款
系統 SHALL 提供 `confirmMaterialPayment(orderId)` Server Action，僅管理者可呼叫。SHALL 要求 `paymentReportedAt` 非 null，寫入 `paymentConfirmedAt`，並通知老師款項已確認。

#### Scenario: 確認收款成功
- **WHEN** 管理者對「待確認收款」訂單點「確認收款」
- **THEN** 寫入 `paymentConfirmedAt`，狀態進入「待寄送」，通知老師款項已確認，回傳 `{ success: true }`

#### Scenario: 老師尚未回填不可確認
- **WHEN** `paymentReportedAt` 為 null 時呼叫
- **THEN** 回傳 `{ success: false, message: '老師尚未回填匯款資訊' }`

#### Scenario: 非管理者不可確認收款
- **WHEN** 非管理者呼叫 `confirmMaterialPayment`
- **THEN** 回傳 `{ success: false, message: '無權限' }`

### Requirement: 老師端付款流程介面
課程頁老師端 SHALL 依訂單付款狀態呈現對應內容：待批價顯示等待提示；待付款顯示批價金額、多行匯款帳號資訊與「回填後五碼」表單；待確認收款顯示「已回填，等待管理者確認收款」。匯款帳號資訊 SHALL 以獨立區塊呈現並保留換行（`whitespace-pre-wrap` 或等效），不得行內拼接。

#### Scenario: 待付款顯示金額與匯款帳號資訊
- **WHEN** 老師開啟已批價（待付款）課程的教材區
- **THEN** 顯示批價金額、多行匯款帳號資訊（`remittanceAccount`，保留換行的區塊呈現）與後五碼回填表單

#### Scenario: 待確認收款顯示等待提示
- **WHEN** 老師已回填後五碼（待確認收款）
- **THEN** 教材區顯示「已回填匯款後五碼，等待管理者確認收款」

### Requirement: 通知內文多行呈現
通知列表頁 SHALL 保留通知內文的換行格式（`whitespace-pre-wrap` 或等效）呈現多行內容；通知抽屜預覽 MAY 維持截斷（如 `line-clamp-2`）。

#### Scenario: 通知列表頁顯示多行匯款資訊
- **WHEN** 老師於通知列表頁檢視批價完成通知
- **THEN** 通知內文的匯款帳號資訊逐行呈現，換行不被壓縮


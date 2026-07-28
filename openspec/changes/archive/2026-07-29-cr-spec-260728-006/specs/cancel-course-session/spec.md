## ADDED Requirements

### Requirement: 結業回退作業
課程詳情頁 SHALL 於課程**已結業**（`completedAt != null` 且未取消）時，對**該課講師與管理者**顯示「結業回退作業」區塊（樣式比照重新招募作業）：說明文字＋「退回進行中」按鈕，點擊後 SHALL 以確認 dialog 提示影響（將清除課程結業標記、班級評分與心得、全部學員的結業標記；已寄出的結業信無法收回，若日後重新結業將對同一批學員再寄一次結業信），確認後系統 SHALL 於單一交易內：清除 `CourseInvite.completedAt`／`gradRating`／`gradTestimony`，並清除該課全部 `InviteEnrollment.graduatedAt`／`nonGraduateReason`（回復為 approved、未結業）。此操作 SHALL NOT 發送通知、SHALL NOT 寄送任何信件、SHALL NOT 寫入操作紀錄。Server Action 守衛 SHALL 為「該課建立者或 `canAccessAdmin`」，且僅於已結業狀態可執行。

#### Scenario: 已結業退回進行中
- **WHEN** 該課講師或管理者於已結業課程點「退回進行中」並確認
- **THEN** `CourseInvite.completedAt`／`gradRating`／`gradTestimony` 清空，課程狀態回進行中；該課全部學員 `graduatedAt`／`nonGraduateReason` 清空

#### Scenario: 非已結業不可退回
- **WHEN** 課程為招生中、進行中或已取消時呼叫結業回退 Server Action
- **THEN** 系統拒絕並回傳狀態不符錯誤（「僅已結業的課程可退回進行中」）

#### Scenario: 無權限者無法操作
- **WHEN** 非該課建立者且非管理者呼叫結業回退 Server Action
- **THEN** 回傳無權限錯誤

#### Scenario: 學員不可見結業回退區塊
- **WHEN** 一般學員檢視已結業課程詳情頁
- **THEN** 不顯示結業回退作業區塊

#### Scenario: 確認視窗明示重複寄信風險
- **WHEN** 該課講師或管理者點擊「退回進行中」開啟確認 dialog
- **THEN** dialog 內容明確提示已寄出的結業信無法收回，若日後重新結業將對同一批學員再次寄送結業信

#### Scenario: 不影響證書資格佇列與已產生證書
- **WHEN** 已結業課程執行結業回退
- **THEN** 系統不修改任何 `CertificateProduction` 紀錄（不隨本操作自動處理實體證書狀態）

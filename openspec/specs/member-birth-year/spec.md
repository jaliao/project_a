# member-birth-year Specification

## Purpose
TBD - created by archiving change cr-spec-260629-001. Update Purpose after archive.
## Requirements
### Requirement: 會員出生年欄位
系統 SHALL 於 `User` 提供 `birthYear` 欄位，型別為可空整數（`Int?`），語意為**西元年 4 位數**。既有會員未填時為 `null`，不影響其登入與既有功能。

#### Scenario: 既有會員無出生年
- **WHEN** 既有會員（`birthYear` 為 null）登入並使用系統
- **THEN** 系統正常運作，不因 `birthYear` 為 null 而出錯

#### Scenario: 新會員儲存出生年
- **WHEN** 會員提供有效西元出生年並儲存
- **THEN** 系統將該西元年整數寫入 `User.birthYear`

### Requirement: 出生年範圍驗證
系統 SHALL 對出生年輸入做範圍驗證，僅接受合理西元年（1900 至當年）之 4 位數整數；超出範圍或非整數 SHALL 被拒絕並顯示錯誤。

#### Scenario: 有效出生年通過
- **WHEN** 會員輸入介於 1900 與當年之間的西元年（如 1990）
- **THEN** 驗證通過，可儲存

#### Scenario: 超出範圍的出生年被拒
- **WHEN** 會員輸入小於 1900、大於當年、或非整數的出生年
- **THEN** 系統拒絕並顯示範圍錯誤訊息，不寫入

### Requirement: 個人資料頁可維護出生年
個人基本資料頁 SHALL 提供「出生年」欄位供本人檢視與維護（新增/修改/清空），與既有性別、所屬教會欄位並列。

#### Scenario: 於個人資料頁填寫出生年
- **WHEN** 會員於個人基本資料頁輸入有效西元出生年並送出
- **THEN** 系統儲存 `birthYear` 並提示更新成功

#### Scenario: 顯示既有出生年
- **WHEN** 會員開啟個人基本資料頁且 `birthYear` 有值
- **THEN** 出生年欄位預填目前值


## MODIFIED Requirements

### Requirement: 出貨單列印頁收件資訊顯示
出貨單列印頁 SHALL 依取貨方式顯示正確的收件資訊。

#### Scenario: 超商取貨（7-11 / 全家）顯示門市資訊
- **WHEN** `deliveryMethod` 為 `sevenEleven` 或 `familyMart`
- **THEN** 收件資訊區塊顯示「門市名稱」列（`storeName`）與「門市店號」列（`storeId`），不顯示地址列

#### Scenario: 門市資訊為空時顯示提示
- **WHEN** `deliveryMethod` 為超商取貨但 `storeName` / `storeId` 為空值
- **THEN** 顯示「（未填）」

#### Scenario: 郵寄顯示收件地址
- **WHEN** `deliveryMethod` 為 `delivery`
- **THEN** 收件資訊區塊顯示「收件地址」列（`deliveryAddress`），不顯示門市欄位

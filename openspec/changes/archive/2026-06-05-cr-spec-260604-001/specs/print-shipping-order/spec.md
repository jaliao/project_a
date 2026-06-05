## MODIFIED Requirements

### Requirement: 出貨單列印頁面
系統 SHALL 在 `/admin/materials/[id]/print` 提供出貨單列印頁面，僅管理者可存取。頁面以列印友善版面呈現，透過 `window.print()` 觸發瀏覽器列印。

對於多地址寄送的訂單，列印頁 SHALL 為**每個寄送批次各產生一份出貨單**（各自分頁列印），每份的書本版本與數量取自該批次而非整張訂單統計；單一地址訂單維持單一份出貨單，數量取自學員統計。

#### Scenario: 管理者開啟出貨單列印頁
- **WHEN** 管理者導覽至 `/admin/materials/[id]/print`
- **THEN** 頁面顯示完整出貨單內容，包含：申請編號、課程名稱、收件者姓名、寄件方式、地址（門市店號或收件地址）、書本版本與數量

#### Scenario: 多地址訂單列印多份
- **WHEN** 訂單為多地址寄送且含 N 個寄送批次
- **THEN** 列印頁產生 N 份出貨單，每份顯示該批次的寄件方式、地址與該批次的繁體/簡體本數

#### Scenario: 一般使用者無法存取列印頁
- **WHEN** role 非 admin/superadmin 的使用者存取列印頁
- **THEN** 重導至首頁或顯示 403

#### Scenario: 書本數量從學員資料統計（單一地址）
- **WHEN** 單一地址訂單的出貨單頁面載入
- **THEN** 繁體數量 = 該課程 approved 學員中 materialChoice = traditional 的人數；簡體數量 = materialChoice = simplified 的人數

#### Scenario: 地址欄位依寄件方式顯示不同 label
- **WHEN** `deliveryMethod` 為 `sevenEleven` 或 `familyMart`
- **THEN** 地址欄標題顯示「門市店號 / 門市名稱」

#### Scenario: 宅配時地址欄 label 為收件地址
- **WHEN** `deliveryMethod` 為 `delivery`
- **THEN** 地址欄標題顯示「收件地址」

#### Scenario: deliveryAddress 為空時顯示未填
- **WHEN** 對應地址欄位（訂單或批次）為 null 或空白
- **THEN** 該欄位顯示「（未填）」

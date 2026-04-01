## ADDED Requirements

### Requirement: 開啟 ECPay 超商門市選擇器
系統 SHALL 提供 `EcpayStoreSelector` 元件，依傳入的 `logisticsSubType`（`UNIMART` 或 `FAMI`）開啟對應的 ECPay MapCVS 門市選擇頁面。

#### Scenario: 點擊「選取門市」開啟 7-11 選擇器
- **WHEN** 使用者選擇 `DeliveryMethod.sevenEleven` 並點擊「選取門市」按鈕
- **THEN** 以 `window.open` 開啟 `/api/ecpay/store-map?type=UNIMART`，新視窗自動 POST 至 ECPay MapCVS 並顯示 7-11 門市選擇 UI

#### Scenario: 點擊「選取門市」開啟全家選擇器
- **WHEN** 使用者選擇 `DeliveryMethod.familyMart` 並點擊「選取門市」按鈕
- **THEN** 以 `window.open` 開啟 `/api/ecpay/store-map?type=FAMI`，新視窗自動 POST 至 ECPay MapCVS 並顯示全家門市選擇 UI

#### Scenario: Mock 模式（ECPAY_LOGISTICS_SERVER_URL 未設定）
- **WHEN** 伺服器 `ECPAY_LOGISTICS_SERVER_URL` 環境變數未設定，使用者點擊「選取門市」
- **THEN** `/api/ecpay/store-map` 直接回傳含模擬門市資料的 HTML 頁面（無需開啟 ECPay 外部連結），觸發 `postMessage` 後關閉視窗

### Requirement: 接收 ECPay Callback 並通知父視窗
系統 SHALL 提供 API Route `/api/ecpay/store-callback`，接收 ECPay POST 回傳的門市資料，並以 `postMessage` 通知開啟此視窗的父視窗。

#### Scenario: ECPay 成功回傳門市資料
- **WHEN** 使用者在 ECPay MapCVS 選取門市，ECPay POST `{ CVSStoreID, CVSStoreName }` 至 `/api/ecpay/store-callback`
- **THEN** callback 頁面渲染含 `window.opener?.postMessage({ storeId: CVSStoreID, storeName: CVSStoreName }, window.location.origin)` 的 script，並自動關閉視窗

#### Scenario: 父視窗已關閉時降級處理
- **WHEN** `window.opener` 為 null（父視窗已關閉）
- **THEN** callback 頁面顯示「已選取：{storeName}，請關閉此視窗並重新操作」，不拋出例外

### Requirement: 驗證 postMessage 來源
系統 SHALL 在 `EcpayStoreSelector` 元件中僅接受來自 `window.location.origin` 的 `postMessage`，忽略其他來源。

#### Scenario: 接受同源 postMessage
- **WHEN** `event.origin === window.location.origin` 且 payload 包含 `{ storeId, storeName }`
- **THEN** 元件更新表單狀態，顯示已選取門市資訊

#### Scenario: 忽略非同源訊息
- **WHEN** `event.origin !== window.location.origin`
- **THEN** 忽略該訊息，不更新表單狀態

### Requirement: 顯示已選取門市資訊
系統 SHALL 在使用者選取門市後顯示門市名稱與店號，並提供重新選取功能。

#### Scenario: 成功選取門市後顯示資訊
- **WHEN** 使用者透過 ECPay MapCVS 選取門市，元件收到 `{ storeId, storeName }`
- **THEN** 顯示「已選取：{storeName}（{storeId}）」，按鈕文字更新為「重新選取」

#### Scenario: 點擊「重新選取」
- **WHEN** 使用者已選取門市，點擊「重新選取」按鈕
- **THEN** 再次開啟 ECPay MapCVS 門市選擇器，選取後更新 `storeId` 與 `storeName`

### Requirement: 切換取貨方式時清除門市資料
系統 SHALL 在使用者切換 `deliveryMethod` 時清除已選取的門市資料。

#### Scenario: 從 7-11 切換至全家
- **WHEN** 使用者將 `deliveryMethod` 從 `sevenEleven` 切換至 `familyMart`
- **THEN** `storeId` 與 `storeName` 清除為空值，顯示全家門市選擇器（未選取狀態）

#### Scenario: 從超商切換至郵寄
- **WHEN** 使用者將 `deliveryMethod` 切換至 `delivery`
- **THEN** `storeId` 與 `storeName` 清除為空值，顯示 `deliveryAddress` 文字輸入欄位

### Requirement: 超商取貨表單驗證
系統 SHALL 在選擇超商取貨（7-11 或全家）提交表單時，驗證 `storeId` 與 `storeName` 皆不為空。

#### Scenario: 未選取門市即嘗試提交
- **WHEN** 使用者選擇 `DeliveryMethod.sevenEleven` 或 `DeliveryMethod.familyMart` 但未選取門市即點擊送出
- **THEN** 表單顯示「請選取取貨門市」錯誤訊息，阻止送出

#### Scenario: 已選取門市可正常提交
- **WHEN** `storeId` 與 `storeName` 皆有值
- **THEN** 表單可正常送出，`storeId` 與 `storeName` 包含在提交資料中

### Requirement: 伺服器端 ECPay MapCVS 請求產生
系統 SHALL 提供 API Route `/api/ecpay/store-map`，在伺服器端計算 CheckMacValue（MD5）並產生自動 POST 至 ECPay 的 HTML 表單，不在前端暴露 HashKey / HashIV。

#### Scenario: 產生 7-11 選擇器頁面
- **WHEN** GET `/api/ecpay/store-map?type=UNIMART`
- **THEN** 回傳含自動 submit form 的 HTML，POST 至 ECPay `https://logistics-stage.ecpay.com.tw/Express/map`（測試）或正式環境，參數包含計算正確的 CheckMacValue

#### Scenario: 產生全家選擇器頁面
- **WHEN** GET `/api/ecpay/store-map?type=FAMI`
- **THEN** 回傳含自動 submit form 的 HTML，`LogisticsSubType=FAMI`，其餘同上

#### Scenario: 無效的 type 參數
- **WHEN** GET `/api/ecpay/store-map?type=INVALID`
- **THEN** 回傳 400 錯誤

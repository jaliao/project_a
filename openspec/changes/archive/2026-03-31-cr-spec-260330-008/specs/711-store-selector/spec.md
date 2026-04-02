## ADDED Requirements

### Requirement: 開啟 7-11 門市選擇器
系統 SHALL 在教材申請表單選擇「7-11 取貨」時，提供「選取門市」按鈕以開啟 7-11 官方門市選擇器。

#### Scenario: 點擊「選取門市」開啟選擇器
- **WHEN** 使用者選擇 `DeliveryMethod.sevenEleven` 並點擊「選取門市」按鈕
- **THEN** 以 `window.open` 開啟 7-11 官方門市選擇器 URL（由 `NEXT_PUBLIC_711_MAP_URL` 環境變數決定）

#### Scenario: 尚未選取門市時顯示提示
- **WHEN** 使用者選擇 `DeliveryMethod.sevenEleven` 但尚未選取門市
- **THEN** 顯示「請點擊選取門市」提示文字，並將「選取門市」按鈕標示為必填

### Requirement: 接收門市選擇結果
系統 SHALL 透過 `window.addEventListener('message')` 接收 7-11 選擇器回傳的門市資料，並驗證來源網域。

#### Scenario: 成功選取門市
- **WHEN** 使用者在選擇器中選取門市，7-11 頁面以 `postMessage` 回傳 `{ storeId, storeName }` 資料
- **THEN** 表單顯示「已選取：{storeName}（{storeId}）」，「選取門市」按鈕文字更新為「重新選取」，`storeId` 與 `storeName` 綁定至表單欄位

#### Scenario: 來源網域不符時忽略訊息
- **WHEN** `postMessage` 的 `event.origin` 不符合 7-11 官方網域白名單
- **THEN** 忽略該訊息，不更新表單欄位

#### Scenario: 使用者關閉選擇器但未選取
- **WHEN** 使用者關閉 7-11 選擇器視窗但未選取任何門市
- **THEN** 表單保持原有狀態（若已有選取則維持，若尚未選取則維持未選取）

### Requirement: 重新選取門市
系統 SHALL 允許使用者在已選取門市後重新選取。

#### Scenario: 點擊「重新選取」
- **WHEN** 使用者已選取門市，點擊「重新選取」按鈕
- **THEN** 再次開啟 7-11 門市選擇器，使用者重新選取後更新 `storeId` 與 `storeName`

### Requirement: 切換取貨方式時清除門市資料
系統 SHALL 在使用者切換取貨方式（離開 7-11）時清除已選取的門市資料。

#### Scenario: 從 7-11 切換至其他取貨方式
- **WHEN** 使用者將 `deliveryMethod` 從 `sevenEleven` 切換至 `familyMart` 或 `delivery`
- **THEN** `storeId` 與 `storeName` 清除為空值，顯示對應取貨方式的欄位

### Requirement: 7-11 門市選擇表單驗證
系統 SHALL 在選擇 7-11 取貨方式提交表單時，驗證 `storeId` 與 `storeName` 皆不為空。

#### Scenario: 未選取門市即嘗試提交
- **WHEN** 使用者選擇 `DeliveryMethod.sevenEleven` 但未選取門市即點擊送出
- **THEN** 表單顯示「請選取取貨門市」錯誤訊息，阻止送出

#### Scenario: 已選取門市可正常提交
- **WHEN** 使用者已選取門市且 `storeId`、`storeName` 皆有值
- **THEN** 表單可正常送出，`storeId` 與 `storeName` 包含在提交資料中

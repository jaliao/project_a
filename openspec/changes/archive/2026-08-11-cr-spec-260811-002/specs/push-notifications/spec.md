## ADDED Requirements

### Requirement: 推播訂閱管理
系統 SHALL 允許已登入使用者在目前瀏覽器／裝置上訂閱瀏覽器推播通知，訂閱資訊（`endpoint`／`p256dh`／`auth`）SHALL 儲存於 `PushSubscription` 資料表並關聯至該使用者；使用者 SHALL 可取消訂閱，取消後系統 SHALL 刪除對應資料列。

#### Scenario: 使用者訂閱推播通知
- **WHEN** 已登入使用者在支援的瀏覽器上啟用推播通知開關，並同意瀏覽器通知權限請求
- **THEN** 系統呼叫 `subscribeToPush`，於 `PushSubscription` 新增一筆記錄

#### Scenario: 使用者取消訂閱推播通知
- **WHEN** 已訂閱的使用者關閉推播通知開關
- **THEN** 系統呼叫 `unsubscribeFromPush`，刪除對應該裝置 `endpoint` 的 `PushSubscription` 記錄

#### Scenario: 使用者拒絕瀏覽器通知權限
- **WHEN** 使用者啟用推播通知開關後，於瀏覽器權限請求中選擇「封鎖」
- **THEN** 開關保持關閉狀態，不建立 `PushSubscription` 記錄

#### Scenario: iOS 非 standalone 模式嘗試訂閱
- **WHEN** iOS Safari 使用者在非已安裝（standalone）模式下嘗試啟用推播通知開關
- **THEN** 系統顯示提示訊息，說明需先將系統加入主畫面後才能開啟推播通知，不嘗試訂閱

#### Scenario: 同一使用者多裝置訂閱
- **WHEN** 同一使用者在不同瀏覽器或裝置上分別啟用推播通知
- **THEN** 系統各自建立獨立的 `PushSubscription` 記錄（依 `endpoint` 區分），皆會收到推播

### Requirement: 通知建立時觸發推播
系統 SHALL 在既有 `createNotification()`（系統通知寫入的唯一集中函式）寫入一筆 `Notification` 記錄後，對該使用者所有有效的 `PushSubscription` 送出瀏覽器推播通知，內容包含通知標題與內容；單一訂閱送出失敗不應影響其他訂閱的送出，也不應影響 `Notification` 記錄本身的寫入。

#### Scenario: 使用者有訂閱時建立通知
- **WHEN** 系統任一既有流程（如課程開課通知、報名核准通知、站內訊息）呼叫 `createNotification()`，且該使用者存在一筆以上有效 `PushSubscription`
- **THEN** 系統於寫入 `Notification` 後，對每筆訂閱送出推播通知

#### Scenario: 使用者無訂閱時建立通知
- **WHEN** `createNotification()` 被呼叫，但該使用者無任何 `PushSubscription` 記錄
- **THEN** 系統僅寫入 `Notification` 記錄，不嘗試送出推播，不產生錯誤

#### Scenario: 訂閱已失效
- **WHEN** 對某筆 `PushSubscription` 送出推播時，推播服務回應 404 或 410（訂閱已失效）
- **THEN** 系統刪除該筆 `PushSubscription` 記錄，其餘訂閱的送出不受影響

#### Scenario: 推播送出時發生非失效性錯誤
- **WHEN** 對某筆 `PushSubscription` 送出推播時發生非 404/410 的錯誤（如網路逾時）
- **THEN** 系統記錄錯誤 log，不刪除該筆訂閱，不拋出例外中斷 `createNotification()` 其餘流程

### Requirement: 推播通知點擊行為
系統 SHALL 在使用者點擊瀏覽器推播通知時，開啟或聚焦本系統視窗（導向首頁），不需登入即可觸發此行為（實際存取仍受既有登入守衛保護）。

#### Scenario: 點擊推播通知且系統已在背景開啟
- **WHEN** 使用者點擊推播通知，且瀏覽器已有本系統分頁在背景
- **THEN** 該分頁被聚焦至前景

#### Scenario: 點擊推播通知且系統未開啟
- **WHEN** 使用者點擊推播通知，且瀏覽器沒有任何本系統分頁開啟
- **THEN** 開啟新分頁導向本系統首頁

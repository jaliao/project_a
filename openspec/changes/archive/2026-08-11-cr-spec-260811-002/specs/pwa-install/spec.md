## ADDED Requirements

### Requirement: PWA Manifest 與圖示
系統 SHALL 提供符合規範的 Web App Manifest（`app/manifest.ts`），內容包含應用程式名稱、簡稱、`start_url`、`display: standalone`、`theme_color`（沿用品牌主色）、`background_color`，以及至少 192×192 與 512×512 兩種尺寸的圖示（`purpose: any`）與一組 `purpose: maskable` 圖示。圖示內容 SHALL 為藍底（品牌主色）搭配白色字母「A」，經伺服器端動態產生，不依賴人工提供之圖檔資產。

#### Scenario: 瀏覽器讀取 manifest
- **WHEN** 瀏覽器請求 `/manifest.webmanifest`
- **THEN** 回應內容包含正確的 `name`／`short_name`／`icons`／`start_url`／`display: standalone`／`theme_color`／`background_color`

#### Scenario: 圖示動態產生
- **WHEN** 瀏覽器請求 manifest 中指定的圖示路由（192×192／512×512）
- **THEN** 回應為對應尺寸的 PNG 圖片，內容為品牌主色底色搭配白色字母「A」，並帶有長效 `Cache-Control` 標頭

### Requirement: Service Worker 註冊
系統 SHALL 提供最小 service worker（`public/sw.js`），於使用者載入任一頁面時由前端自動註冊；該 service worker SHALL 能接收 `push` 事件並顯示系統通知，以及處理 `notificationclick` 事件開啟或聚焦本系統視窗。Service worker 不進行任何頁面或 API 回應的離線快取。

#### Scenario: 首次載入頁面時註冊 service worker
- **WHEN** 使用者以支援 service worker 的瀏覽器開啟系統任一頁面
- **THEN** 前端呼叫 `navigator.serviceWorker.register('/sw.js')` 完成註冊

#### Scenario: 瀏覽器不支援 service worker
- **WHEN** 使用者瀏覽器不支援 `serviceWorker` API
- **THEN** 系統略過註冊，不顯示錯誤訊息，其餘頁面功能不受影響

### Requirement: PWA 啟動方式偵測
系統 SHALL 提供前端判斷邏輯，偵測目前頁面是否以 PWA（已加入主畫面之 standalone）方式啟動，綜合 `matchMedia('(display-mode: standalone)')` 與 iOS 專屬 `navigator.standalone` 屬性。

#### Scenario: 以 PWA 方式啟動
- **WHEN** 使用者從已安裝的主畫面圖示開啟系統
- **THEN** 偵測邏輯回傳「已為 standalone 啟動」

#### Scenario: 以一般瀏覽器分頁開啟
- **WHEN** 使用者以一般瀏覽器分頁（非安裝後啟動）開啟系統
- **THEN** 偵測邏輯回傳「非 standalone 啟動」

### Requirement: PWA 安裝說明頁
系統 SHALL 提供公開（免登入）頁面 `/pwa-install`，分別列出 iOS Safari、Android Chrome、桌面 Chrome 三種平台的「加入主畫面／安裝應用程式」操作步驟；公開首頁 SHALL 提供連結導向此頁面。

#### Scenario: 未登入使用者開啟安裝說明頁
- **WHEN** 未登入的訪客直接開啟 `/pwa-install`
- **THEN** 頁面正常顯示，不重新導向至登入頁

#### Scenario: 從公開首頁進入安裝說明頁
- **WHEN** 使用者於公開首頁點擊「安裝到手機桌面」相關連結
- **THEN** 導向 `/pwa-install` 頁面

### Requirement: 登入首頁安裝提醒橫幅
系統 SHALL 在使用者檢視自己的個人首頁（`/user/[spiritId]`）時，若偵測到非 standalone 啟動，顯示可關閉的安裝提醒橫幅；橫幅 SHALL 提供「安裝」（若瀏覽器支援 `beforeinstallprompt`，直接觸發安裝流程）或「查看安裝說明」（導向 `/pwa-install`）按鈕，以及「稍後再說」關閉按鈕。使用者關閉橫幅後，系統 SHALL 於 7 天內不再顯示該橫幅；7 天後若使用者仍未以 standalone 方式啟動，橫幅 SHALL 重新出現。

#### Scenario: 非 standalone 啟動且未曾關閉過提醒
- **WHEN** 使用者以一般瀏覽器開啟自己的個人首頁，且本機瀏覽器無先前關閉紀錄
- **THEN** 頁面顯示安裝提醒橫幅

#### Scenario: 已以 PWA 方式啟動
- **WHEN** 使用者以已安裝的 PWA（standalone）方式開啟個人首頁
- **THEN** 不顯示安裝提醒橫幅

#### Scenario: 支援 beforeinstallprompt 的瀏覽器點擊安裝
- **WHEN** 使用者於 Android 或桌面 Chrome 點擊橫幅「安裝」按鈕
- **THEN** 觸發瀏覽器原生安裝提示（`beforeinstallprompt` 的 `prompt()`）

#### Scenario: 不支援 beforeinstallprompt 的瀏覽器（iOS）
- **WHEN** 使用者於 iOS Safari 檢視橫幅
- **THEN** 橫幅顯示「查看安裝說明」按鈕導向 `/pwa-install`，不顯示「安裝」按鈕

#### Scenario: 關閉橫幅後 7 天內不再顯示
- **WHEN** 使用者點擊「稍後再說」關閉橫幅
- **THEN** 系統於本機記錄關閉時間，7 天內重新載入個人首頁時不再顯示該橫幅

#### Scenario: 關閉橫幅滿 7 天後仍未安裝
- **WHEN** 使用者上次關閉橫幅已超過 7 天，且目前仍為非 standalone 啟動
- **THEN** 橫幅重新出現於個人首頁

#### Scenario: 檢視他人首頁不顯示橫幅
- **WHEN** 使用者檢視非自己的個人首頁（`isOwnPage` 為 `false`）
- **THEN** 不顯示安裝提醒橫幅

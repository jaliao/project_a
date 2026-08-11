## Context

系統目前完全無 PWA 相關基礎建設：無 `public/` 目錄、無 manifest、無 service worker、無任何 logo/icon 檔案（Topbar 與首頁皆用內嵌 SVG），`package.json` 無 `web-push` 或任何推播相關套件。屬全新（greenfield）實作。

通知面有兩套機制並存：
1. **`Notification` model**（`prisma/schema/user.prisma`，`isRead`/`readAt`，無 `type`/`link` 欄位，連結以純文字內嵌於 `body`）——`openspec/specs/notification-inbox`／`notification-history` 描述的既有站內收件匣，透過**唯一集中的** `createNotification(userId, title, body)`（`app/actions/notification.ts:57`）寫入，13 處呼叫端（含 `app/actions/course-invite.ts`、`course-session.ts`、`course-order.ts`、`course-message.ts`、`support-inquiry.ts`，以及**新版站內訊息** `app/actions/conversation.ts:40,162`）皆經此函式，無任何呼叫端繞過直接 `prisma.notification.create`。
2. **`Conversation`／站內訊息**（commit f20ee97）——目前的「未讀」概念是前端由 `message-drawer-provider.tsx` 對已抓取的對話清單做 `isUnread` 計算，屬輪詢／載入時計算，非即時推送；但**新訊息建立時已會呼叫 `createNotification()`**（`conversation.ts:40`），故本次僅擴充 `createNotification()` 單一函式即可同時涵蓋「舊版系統通知」與「新版站內訊息」兩種來源的推播，不需額外分別串接。

個人登入首頁為 `/user/[spiritId]`（`app/[locale]/(user)/user/[spiritId]/page.tsx`），既有 `ProfileBanner`（`components/dashboard/profile-banner.tsx`）以「純伺服器狀態計算」方式顯示（依 `REQUIRE_PROFILE_COMPLETION` 環境變數與資料完整度），**非** localStorage/dismiss 模式；本次安裝提醒橫幅需求「可關閉並記住一段時間」在此專案無先例可循，須新增前端 client-side 的 localStorage dismiss 邏輯。

公開首頁為 `app/[locale]/(guest)/page.tsx`（`app/page.tsx` 路由對應行銷首頁），已登入使用者會被導向 `/user/[spiritId]`，故安裝說明頁需獨立成一個免登入頁面（非首頁本身），並於首頁加連結。

品牌主色為 CSS 變數 `--primary`（`app/globals.css`，HSL `221.2 83.2% 53.3%`，深色模式 `217.2 91.2% 59.8%`），Tailwind v4 CSS-variable-based，無 `tailwind.config.*`。

## Goals / Non-Goals

**Goals:**
- 使系統可被「加入主畫面」，具備最基本可安裝性（manifest + icons + service worker 存在即可，不追求離線快取／offline-first）。
- 動態產生圖示（字母 A + 品牌藍），不需人工提供圖檔資產。
- 提供跨平台（iOS／Android／桌面）安裝說明頁。
- 偵測是否以 standalone 方式啟動，未安裝時於登入首頁提醒，可關閉並於 7 天內不再顯示。
- 既有系統通知（含新版站內訊息，因兩者共用 `createNotification()`）產生時，若使用者已訂閱推播，發送瀏覽器推播通知。

**Non-Goals:**
- **不做離線快取／offline-first**：service worker 僅處理 `install`/`activate`/`push`/`notificationclick` 事件，不快取任何頁面或 API 回應，不影響既有 SSR/資料新鮮度行為。
- **不新增通知分類/連結欄位**：`Notification.body` 仍為純文字，推播的 `body` 直接沿用，不解析或抽取連結；點擊推播通知一律開啟／聚焦首頁（`/`），不做深連結（deep link）導向特定通知來源頁面。
- **不做「站內訊息」獨立即時通知（WebSocket/SSE）**：本次僅利用其既有的 `createNotification()` 呼叫路徑觸發推播，不改變 `Conversation`/`message-drawer-provider` 本身的輪詢式未讀計算邏輯。
- **不支援 iOS 16.4 以下版本**（Web Push 於 iOS 需 16.4+ 且僅限已加入主畫面的 standalone 模式）；不做版本偵測或警告文案，僅在安裝說明頁註明系統需求。
- **不做通知已讀狀態與推播的雙向同步**（例如使用者在其他裝置標記已讀後撤回已送出的推播）——推播為單向 fire-and-forget。

## Decisions

1. **圖示以 `next/og` `ImageResponse` 動態產生，不產出靜態圖檔**
   `app/icon-192/route.tsx`／`app/icon-512/route.tsx` 各自匯出 GET route handler，回傳 `ImageResponse`（藍底圓角方形＋白色粗體字母 A，讀取與 `--primary` 相同的 HSL 值），`Content-Type: image/png`。`app/manifest.ts` 的 `icons` 陣列直接指向這兩個路由（`purpose: 'any'`），並額外加一組 `purpose: 'maskable'`（same route 加 padding 版本或共用同一張圖，因安全區已預留足夠邊距）。好處：無需美術資源、無需存放二進位檔案於 repo、修改品牌色時圖示自動同步。

2. **Service worker 用靜態檔 `public/sw.js`，不引入 `next-pwa`**
   Next 16 尚無官方 PWA plugin 慣例，`next-pwa` 對新版 Next App Router 相容性風險較高（維護狀態不穩定）。改採手寫最小 service worker（純 JS，webpack 不處理），僅監聽 `push`（呼叫 `self.registration.showNotification`）與 `notificationclick`（`clients.openWindow`/`focus`）；`install`/`activate` 立即 `skipWaiting`/`clients.claim()`，不做 cache 策略。由新增的 client component `components/pwa/pwa-register.tsx`（掛載於 `app/[locale]/layout.tsx`）於 mount 時呼叫 `navigator.serviceWorker.register('/sw.js')`。

3. **推播送出點：只改 `createNotification()` 一處**
   因專案已存在單一集中寫入點（見 Context），推播邏輯（讀取該 `userId` 的 `PushSubscription` 清單、逐一呼叫 `webpush.sendNotification`）直接加在 `createNotification()` 內部，`await` 但個別訂閱失敗不應阻斷通知寫入本身——用 `Promise.allSettled` 逐一送出，送出失敗（410/404，訂閱已失效）時刪除該筆 `PushSubscription`，其餘錯誤僅記錄 log，不拋出。13 個既有呼叫端完全不需改動。

4. **`PushSubscription` 為獨立新表，非併入 `User`**
   一位使用者可能有多個裝置／瀏覽器各自訂閱，`endpoint` 唯一識別一組訂閱，比照 `NextAuth` `Account` 模型「一對多」慣例，獨立成表並 `onDelete: Cascade`。

5. **安裝提醒橫幅 dismiss 用 localStorage，key 含使用者無關（單一 key）**
   `pwa-install-dismissed-at` 存 timestamp（非使用者專屬 key，因裝置/瀏覽器本身就是安裝的單位，不需要跨裝置同步「已提醒過」狀態——同一瀏覽器換帳號登入時繼續套用同一則提醒節流是合理行為）。判斷式：`!isStandalone && (!dismissedAt || now - dismissedAt > 7天)`。

6. **`beforeinstallprompt` 事件的取用時機**
   Android/桌面 Chrome 會觸發 `beforeinstallprompt`，需在 `pwa-register.tsx`（全域掛載、mount 早）監聽並 `event.preventDefault()` 後存入 module-level 變數／context，供 `install-banner.tsx` 的「安裝」按鈕呼叫 `prompt()`。iOS Safari 不觸發此事件，安裝橫幅偵測不到時 fallback 顯示「查看安裝說明」導向 `/pwa-install`。

7. **推播訂閱開關放在既有通知 Drawer 內，不另開設定頁**
   專案目前無獨立「使用者設定」頁面，比照現有「全部標為已讀」按鈕位置模式，於 Drawer 頂部（`notification-inbox` 對應元件）新增「啟用推播通知」開關，點擊時才觸發瀏覽器 `Notification.requestPermission()` 與 `pushManager.subscribe()`（不在頁面載入時主動彈出權限請求，避免打擾）。

8. **`middleware.ts` matcher 需排除 PWA 特殊檔案**（實作階段發現，原設計未預期）
   `app/manifest.ts`／`app/icon-192`／`app/icon-512`／`public/sw.js` 皆位於 `app/` 根層級（不在 `[locale]` 之下），但既有 `middleware.ts` 的 matcher 未排除這些路徑，導致 next-intl middleware 對其加上 locale 前綴改寫（如 `/zh-TW/icon-192`），造成 404（`sw.js`／icon 路由）或被導向 `/login`（因未登入時 `isPublicRoute` 判斷不到這些路徑）。修正：於 `middleware.ts` 的 `config.matcher` 負向前瞻中新增排除 `manifest.webmanifest`／`sw\.js`／`icon-192`／`icon-512`，使這些請求完全略過 middleware（含 next-intl 與登入檢查），與 `favicon.ico` 等既有排除項目一致處理，不透過 `lib/auth/route-access.ts` 宣告（宣告了middleware 也不會執行到，屬死代碼）。

9. **`Dockerfile.prod` 需額外複製 `public/`**（正式環境驗證時發現，原設計未預期）
   Next.js `output: 'standalone'` 建置模式**不會**自動把 `public/` 目錄打包進 `.next/standalone`，`Dockerfile.prod` 的 runner 階段只 `COPY` 了 `.next/standalone` 與 `.next/static`，缺少 `COPY --from=builder /app/public ./public`（`Dockerfile.prodfull` 原本就有這行，只有實際上線用的 `Dockerfile.prod` 遺漏——此專案在本次之前從無 `public/` 目錄，此缺口從未被觸發過）。導致正式環境部署後 `public/sw.js` 404，Web Push 訂閱即使成功也完全收不到通知（無 service worker 監聽 `push` 事件）。已修正 `Dockerfile.prod`，需重新 build + 部署才會生效。

10. **`NEXT_PUBLIC_VAPID_PUBLIC_KEY` 需以 build arg 傳入，不能只靠 runtime env**（正式環境驗證時發現，原設計未預期）
    `NEXT_PUBLIC_*` 變數是在 `next build` 當下就直接內嵌進前端 JS bundle 的 build-time 值，`docker-compose.prod.yml`／`Dockerfile.prod` 原本只把 `DATABASE_URL` 當 build arg 傳入（`npx prisma generate` 需要），未比照辦理 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`，導致編譯出的前端程式碼讀到 `undefined`，`push-toggle.tsx` 的 `if (!publicKey) return` 靜默返回、點擊開關毫無反應也無任何錯誤提示。已修正：`docker-compose.prod.yml` 新增 `build.args`、`Dockerfile.prod` builder 階段新增對應 `ARG`/`ENV`；已透過 `docker build --target builder` 加 `--build-arg` 實際驗證公鑰字串確實被內嵌進編譯後的 JS chunk 才確認修正有效。

11. **正式機實際執行的 `docker-compose.yml` 與本機 `docker-compose.prod.yml` 是兩份獨立、不同步的檔案**（正式環境驗證時發現，原設計未預期）
    本機 `docker-compose.prod.yml` 用 `env_file: .env` 從檔案讀取環境變數；但正式機（`/home/ubuntu/vps-sn/project-a/docker-compose.yml`）走的是完全不同的維運慣例——所有環境變數（含各種第三方服務 secrets）直接明文寫死在 `environment:` 區塊裡，**沒有 `.env` 檔案、也沒有 `env_file`**。這代表本機 `.env` 新增的 `VAPID_PRIVATE_KEY`／`VAPID_SUBJECT`（伺服器端 runtime 值，非 build-time）完全不會反映到正式機，`webpush.setVapidDetails()` 從未在正式機被正確設定，推播送出必定失敗（`sendPushToUser()` 的錯誤被 catch 後只寫 log，前端使用者完全無感知，容易誤以為是別的問題）。已修正：SSH 至正式機，備份原檔後於 `environment:` 區塊比照既有寫法明文新增 `VAPID_PUBLIC_KEY`／`VAPID_PRIVATE_KEY`／`VAPID_SUBJECT` 三行，`docker compose up -d` 套用並驗證 container 內確實讀到。**後續若正式站程式碼有新增其他環境變數依賴，需比照此模式手動同步到正式機這份 `docker-compose.yml`，不會隨本機 `.env`／`docker-compose.prod.yml` 自動更新。**

12. **`push-toggle.tsx` 避免依賴可能永遠不 resolve 的 `navigator.serviceWorker.ready`**（正式環境驗證時發現，原設計未預期）
    `serviceWorker.ready` 只有在「已有 service worker 實際控制此頁」時才會 resolve；若 SW 註冊從未成功過（如 Decision 9 的 `sw.js` 404 情境），這個 Promise 會永遠卡在 pending、不 resolve 也不 reject，導致 `setBusy(true)` 後 `finally { setBusy(false) }` 永遠執行不到，開關永久卡在 `disabled` 狀態且畫面上沒有任何提示——使用者會誤以為開關「壞掉」而非「暫時因故無法使用」。已修正：改用 `navigator.serviceWorker.getRegistration()`（保證即時回傳，不論成功與否）取代 `.ready`；若尚無註冊則當場呼叫 `register('/sw.js')`（失敗時會正常 `reject`，不會卡住），並補上 `catch` 顯示錯誤提示（新增 i18n key `pwa.pushToggle.subscribeFailed`），確保任何失敗情境下 UI 都會給出明確回饋而非無聲卡死。

## Risks / Trade-offs

- **[風險] iOS Safari 對 Web Push 支援條件嚴格（需 16.4+ 且必須是已安裝的 standalone PWA）** → 可接受：安裝說明頁與安裝提醒橫幅本身即是為了引導使用者先安裝，形成「先裝 PWA → 才能訂閱推播」的自然順序；非 standalone 的 iOS 使用者點擊「啟用推播通知」時顯示對應提示文案（例如「請先加入主畫面後才能開啟推播通知」），不視為錯誤。
- **[風險] VAPID 金鑰遺失或輪替會使既有訂閱全數失效** → 可接受：屬一次性設定，`.env.example` 需註明產生方式（`web-push generate-vapid-keys`）；失效訂閱會在下次送出失敗時自動被 410/404 邏輯清除，使用者重新開啟開關即可。
- **[風險] 動態 `ImageResponse` 圖示路由若無快取頭，可能增加請求負擔** → 可接受：圖示內容固定不變，於 route handler 回應加上長效 `Cache-Control`（如 `public, max-age=31536000, immutable`），交由瀏覽器/CDN 快取。
- **[取捨] Service worker 不做離線快取** → 換取實作簡單、避免 SSR/資料新鮮度相關的快取失效問題；使用者離線時開啟系統仍會顯示瀏覽器離線頁，非本次需求範圍。

## Migration Plan

1. `prisma/schema/user.prisma`：新增 `PushSubscription` model 與 `User.pushSubscriptions` 關聯欄位；`make schema-update name=pwa_push_subscription`。
2. 安裝 `web-push`（`npm install web-push` + `npm install -D @types/web-push`），`.env.example` 新增 `VAPID_PUBLIC_KEY`／`VAPID_PRIVATE_KEY`／`VAPID_SUBJECT` 說明。
3. 新增 `app/manifest.ts`、`app/icon-192/route.tsx`、`app/icon-512/route.tsx`、`public/sw.js`。
4. 新增 `hooks/use-is-standalone.ts`、`components/pwa/pwa-register.tsx`（掛載於 `app/[locale]/layout.tsx`）。
5. 新增 `lib/data/push-subscription.ts`、`app/actions/push-subscription.ts`。
6. 修改 `app/actions/notification.ts` 的 `createNotification()`，加入推播送出邏輯。
7. 新增 `components/pwa/push-toggle.tsx`，掛載於既有通知 Drawer 元件內。
8. 新增 `components/pwa/install-banner.tsx`，掛載於 `app/[locale]/(user)/user/[spiritId]/page.tsx`（`isOwnPage` 時）。
9. 新增 `app/[locale]/(guest)/pwa-install/page.tsx`；於 `lib/auth/route-access.ts` 的 `PUBLIC_PAGES` 註冊；於 `app/[locale]/(guest)/page.tsx` 加入連結。
10. `messages/zh-TW.json` 新增 `pwa` 命名空間文案，補 `messages/en.json`，執行 `npm run gen:zh-cn` 產生簡體。
11. `npm run lint` + `npm run build`。
12. 依 CLAUDE.md 第 9 點檢查三份操作手冊是否需補充；`config/version.json` patch 版號 +1。

**Rollback：** 新增資料表可保留不回滾（不影響既有功能）；程式碼變更 revert commit 即可還原，`public/sw.js` 移除後既有已註冊的 service worker 會在下次瀏覽器檢查更新時因 404 自動被瀏覽器解除註冊。

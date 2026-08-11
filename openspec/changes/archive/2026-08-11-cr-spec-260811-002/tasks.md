## 1. 資料層與相依套件

- [x] 1.1 `prisma/schema/user.prisma`：新增 `PushSubscription` model（`id`／`userId`／`endpoint` 唯一／`p256dh`／`auth`／`userAgent?`／`createdAt`，`onDelete: Cascade`），`User` 新增 `pushSubscriptions` 關聯欄位
- [x] 1.2 `make schema-update name=pwa_push_subscription`，確認 migration 產出且 `make prisma-status` 正常
- [x] 1.3 `npm install web-push` + `npm install -D @types/web-push`
- [x] 1.4 產生 VAPID 金鑰（`npx web-push generate-vapid-keys`），`.env.example` 新增 `VAPID_PUBLIC_KEY`／`VAPID_PRIVATE_KEY`／`VAPID_SUBJECT`／`NEXT_PUBLIC_VAPID_PUBLIC_KEY` 說明；本機 `.env` 填入實際值
- [x] 1.5 `lib/data/push-subscription.ts`：新增 `getPushSubscriptionsByUser(userId)`、`upsertPushSubscription(userId, sub)`、`deletePushSubscriptionByEndpoint(endpoint)`

## 2. PWA 可安裝性

- [x] 2.1 `app/manifest.ts`：實作 `MetadataRoute.Manifest`，`name`／`short_name`／`start_url: '/'`／`display: 'standalone'`／`theme_color`／`background_color`（讀取 `--primary` 對應色值）／`icons`（192／512／maskable）
- [x] 2.2 `app/icon-192/route.tsx`、`app/icon-512/route.tsx`：以 `next/og` `ImageResponse` 動態產生藍底白色字母「A」PNG，回應加上長效 `Cache-Control`
- [x] 2.3 `public/sw.js`：最小 service worker，`install`/`activate` 立即 `skipWaiting`/`clients.claim()`；監聽 `push` 事件呼叫 `self.registration.showNotification(title, { body })`；監聽 `notificationclick` 事件，聚焦既有分頁或 `clients.openWindow('/')`
- [x] 2.4 `components/pwa/pwa-register.tsx`（client component）：mount 時註冊 `/sw.js`（若瀏覽器支援），並監聽 `beforeinstallprompt` 事件（`preventDefault()` 後存入 context/module 變數供安裝按鈕使用）
- [x] 2.5 `app/[locale]/layout.tsx`：掛載 `PwaRegister`，`<head>` 加入 manifest link 與 `theme-color` meta（若 `app/manifest.ts` 未自動注入）
- [x] 2.6 `hooks/use-is-standalone.ts`：綜合 `matchMedia('(display-mode: standalone)')` 與 `navigator.standalone` 回傳目前是否為 PWA 啟動

## 3. 安裝說明頁與首頁連結

- [x] 3.1 `lib/auth/route-access.ts`：`PUBLIC_PAGES` 新增 `{ match: 'exact', path: '/pwa-install', reason: 'PWA 安裝說明（免登入）' }`
- [x] 3.2 `app/[locale]/(guest)/pwa-install/page.tsx`：分別列出 iOS Safari／Android Chrome／桌面 Chrome 加入主畫面步驟（文字＋條列）
- [x] 3.3 `app/[locale]/(guest)/page.tsx`：加入導向 `/pwa-install` 的連結（比照既有「找回我的帳號」連結樣式）

## 4. 登入首頁安裝提醒橫幅

- [x] 4.1 `components/pwa/install-banner.tsx`（client component）：使用 `useIsStandalone` 判斷是否顯示；讀寫 `localStorage` key `pwa-install-dismissed-at`（7 天節流邏輯）
- [x] 4.2 橫幅按鈕邏輯：`beforeinstallprompt` 可用時顯示「安裝」按鈕（呼叫 `prompt()`）；否則顯示「查看安裝說明」連結至 `/pwa-install`；另提供「稍後再說」關閉按鈕寫入 localStorage
- [x] 4.3 `app/[locale]/(user)/user/[spiritId]/page.tsx`：`isOwnPage` 時掛載 `InstallBanner`（比照 `ProfileBanner` 掛載位置與條件寫法）

## 5. 推播訂閱與送出

- [x] 5.1 `app/actions/push-subscription.ts`：`subscribeToPush(subscription: { endpoint, keys: { p256dh, auth } })`、`unsubscribeFromPush(endpoint: string)`，皆先 `auth()` 驗證登入
- [x] 5.2 `components/pwa/push-toggle.tsx`（client component）：讀取目前瀏覽器 `pushManager.getSubscription()` 判斷開關初始狀態；點擊時請求 `Notification.requestPermission()` → `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })` → 呼叫 `subscribeToPush`；關閉時呼叫 `pushManager` 的 `unsubscribe()` 與 `unsubscribeFromPush`
- [x] 5.3 非 standalone 的 iOS 裝置點擊開關時，顯示「請先加入主畫面」提示，不執行訂閱流程
- [x] 5.4 掛載 `PushToggle` 於既有通知 Drawer 元件頂部（`notification-inbox` 對應元件，鄰近「全部標為已讀」按鈕）
- [x] 5.5 `app/actions/notification.ts` 的 `createNotification()`：寫入 `Notification` 後，讀取該 `userId` 的 `PushSubscription` 清單，以 `Promise.allSettled` 逐一呼叫 `webpush.sendNotification`（payload 為 `JSON.stringify({ title, body })`）；捕捉個別錯誤，404/410 時刪除該筆訂閱，其餘錯誤僅記錄 log
- [x] 5.6 新增 `lib/push.ts`：封裝 `web-push` 的 VAPID 設定初始化（`webpush.setVapidDetails`），供 `notification.ts` 呼叫

## 6. i18n

- [x] 6.1 `messages/zh-TW.json` 新增 `pwa` 命名空間（安裝橫幅文案、安裝說明頁文案、推播開關文案、iOS 需先安裝提示文案）
- [x] 6.2 `messages/en.json` 補對應英文翻譯
- [x] 6.3 執行 `npm run gen:zh-cn` 產生簡體（不手動修改 `zh-CN.json`）
- [x] 6.4 確認相關元件（server 用 `getTranslations`、client 用 `useTranslations`）皆以 `t()` 取用，不寫死中文

## 7. 驗證

- [x] 7.1 `npm run lint`
- [x] 7.2 `npm run build`
- [x] 7.3 於本機 dev 環境（`npm run dev`）以桌面 Chrome 檢查 DevTools > Application > Manifest 顯示正確，`beforeinstallprompt` 可觸發安裝
- [x] 7.4 於本機 dev 環境手動測試推播全流程：啟用開關 → 觸發任一會建立 `Notification` 的既有流程（如課程開課通知） → 確認收到瀏覽器推播
- [x] 7.5 手動確認關閉推播開關後，`PushSubscription` 記錄確實被刪除
- [x] 7.6 手動確認個人首頁安裝橫幅：非 standalone 顯示、關閉後 7 天內不再出現、standalone 模式不顯示、檢視他人首頁不顯示
- [x] 7.7 手動確認 `/pwa-install` 未登入可直接開啟（已透過 curl 驗證未登入直接回應 200，未經 /login 轉導）

## 8. 文件與版本號同步

- [x] 8.1 檢查 `doc/學員手冊.md`／`doc/老師手冊.md`：是否需補充「安裝到手機桌面」與「開啟推播通知」操作說明——已於 `doc/學員手冊.md` 新增「十二、安裝到手機桌面（PWA）」章節與通知中心推播開關說明；`doc/老師手冊.md` 未新增獨立章節，因該手冊既有慣例不重複一般會員共通的帳號層級功能說明（如密碼管理亦未在此手冊重複，逕引導至學員手冊），PWA/推播為所有會員共通功能，比照此慣例不重複
- [x] 8.2 檢查 `doc/管理者操作手冊.md`：是否需補充相關說明（若無管理者專屬操作可註記原因不修改）——不修改，PWA 安裝／推播為會員前台通用功能，未新增任何後台管理畫面或管理者專屬操作，無實質行為描述缺口
- [x] 8.3 `config/version.json` patch 版號 +1，`updatedAt` 更新為當日日期

## 9. 正式環境部署（實作完成後追加發現）

- [x] 9.1（新增，正式環境驗證時發現）`Dockerfile.prod` runner 階段僅複製 `.next/standalone`／`.next/static`，**未複製 `public/`**——Next standalone 輸出模式不會自動打包 `public/`，導致 `public/sw.js` 在正式站回應 404，Web Push 完全無法運作（訂閱可能成功但瀏覽器無 service worker 可接收/顯示 push 事件）。已修正，新增 `COPY --from=builder --chown=nextjs:nodejs /app/public ./public`（`Dockerfile.prodfull` 原本就有此行，僅 `Dockerfile.prod` 遺漏；正式環境 `docker-compose.prod.yml` 使用的是 `Dockerfile.prod`）
- [x] 9.2 重新 `make push` → `make tunnel-deploy-prd` 部署新 image 至正式環境，並 curl 確認 `https://activate.kuaglobal.org/sw.js` 回應 200（`Content-Type: application/javascript`）——已完成，curl 驗證 `sw.js`／manifest／icon-192／icon-512／icon／apple-icon／pwa-install 皆正確回應
- [x] 9.3 確認正式環境 DB migration 已包含 `PushSubscription` 資料表——已完成，`make prisma-prd-status` 顯示 `Database schema is up to date!`（61 migrations 皆已套用）
- [x] 9.4（新增，正式環境驗證時發現）`docker-compose.prod.yml`／`Dockerfile.prod` 未將 `NEXT_PUBLIC_VAPID_PUBLIC_KEY` 當作 build-time build arg 傳入——`NEXT_PUBLIC_*` 變數會在 `next build` 當下直接內嵌進前端 JS bundle，只有 runtime `env_file` 對已編譯完成的前端程式碼無效，導致前端點擊推播開關時 `publicKey` 讀到 `undefined`、程式碼 `if (!publicKey) return` 靜默無反應（無任何錯誤提示）。已修正：`docker-compose.prod.yml` 新增 `build.args.NEXT_PUBLIC_VAPID_PUBLIC_KEY: ${NEXT_PUBLIC_VAPID_PUBLIC_KEY}`，`Dockerfile.prod` builder 階段新增對應 `ARG`/`ENV`；已用 `docker build --target builder` 實際驗證公鑰字串確實被內嵌進編譯後的 JS chunk
- [x] 9.5（新增，正式環境驗證時發現）正式機實際使用的 `docker-compose.yml`（`/home/ubuntu/vps-sn/project-a/docker-compose.yml`，與本機 `docker-compose.prod.yml` 為兩份不同步的獨立檔案，環境變數採直接寫死於 `environment:` 區塊、無 `env_file`）完全沒有 `VAPID_PUBLIC_KEY`／`VAPID_PRIVATE_KEY`／`VAPID_SUBJECT` 三個執行期變數，導致伺服器端 `webpush.setVapidDetails()` 從未被正確設定，推播送出必定失敗（`app/actions/notification.ts` 的 `sendPushToUser()` 將此錯誤 catch 後僅記錄 log，使用者端完全無感知）。已修正：SSH 至正式機（`35.236.153.251`），備份原檔後於 `environment:` 區塊新增上述三個變數（`VAPID_SUBJECT` 依使用者要求設為 `mailto:justin@blockcode.com.tw`），`docker compose up -d` 重新套用並驗證 container 內確實讀到三個變數
- [x] 9.6（新增，正式環境驗證時發現）`components/pwa/push-toggle.tsx` 使用 `navigator.serviceWorker.ready` 取得 registration——此 Promise 只有在「已有 SW 實際控制此頁」時才 resolve，若 SW 註冊失敗（如 9.1 的 `sw.js` 404 情境）會永遠卡在 pending 不 resolve 也不 reject，導致 `setBusy(true)` 後 `finally` 永遠執行不到，開關永久卡在 disabled 狀態且無任何錯誤提示。已修正：改用 `navigator.serviceWorker.getRegistration()`（一定會即時回傳，不會卡住），取不到時當場 `register('/sw.js')`（失敗會正常 reject）；並補上 `catch` 區塊顯示錯誤提示（新增 i18n key `pwa.pushToggle.subscribeFailed`）
- [x] 9.7 正式環境實測推播全流程：手機以賈斯汀帳號開啟推播開關成功、電腦以系統管理者帳號傳送站內訊息，手機確認收到推播通知——**使用者回報已成功收到**

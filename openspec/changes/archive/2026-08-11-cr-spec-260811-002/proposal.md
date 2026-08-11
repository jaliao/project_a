## Why

系統目前僅為一般網頁，無法讓使用者「加到手機主畫面」以類 App 方式啟動，也沒有推播通知能力——有新通知時使用者只能靠開啟網頁才看得到。CR-SPEC-260811-002 要求將系統改造為 PWA（Progressive Web App）：提供可安裝的 manifest／圖示、安裝說明文件、偵測是否以 PWA 方式啟動、於未安裝時在登入首頁提醒安裝，並在既有「系統通知」（`Notification` model）產生時同步發送瀏覽器推播通知。

## What Changes

- **PWA 可安裝性**：新增 `app/manifest.ts`（Next.js 內建 manifest route）、`public/sw.js`（最小 service worker，僅負責 install/activate 快取略過與 push 事件處理，不做離線快取策略）、動態產生的 App 圖示（沿用現有品牌主色藍底＋白色字母「A」，經 `next/og` `ImageResponse` 動態產生 192×192／512×512／maskable 三種尺寸，不需人工提供圖檔資產）。
- **安裝說明文件頁**：新增公開頁面 `/pwa-install`（納入 `app/(guest)/`，並於 `lib/auth/route-access.ts` 註冊免登入），分別列出 iOS Safari／Android Chrome／桌面 Chrome 的加入主畫面步驟；於公開首頁 `app/[locale]/(guest)/page.tsx` 加入連結。
- **啟動方式偵測**：新增前端 hook（`hooks/use-is-standalone.ts`），以 `matchMedia('(display-mode: standalone)')` 與 iOS `navigator.standalone` 綜合判斷是否為 PWA 啟動。
- **登入首頁安裝提醒**：於個人首頁 `/user/[spiritId]`（`isOwnPage` 時）新增可關閉的安裝提醒橫幅（比照 `ProfileBanner` 位置，`components/pwa/install-banner.tsx`），僅在「非 standalone 啟動」時顯示；提供「安裝」（Android/桌面 Chrome 觸發 `beforeinstallprompt`）或「查看安裝說明」（iOS，連到 `/pwa-install`）按鈕，以及「稍後再說」關閉按鈕。關閉後以 `localStorage` 記錄時間戳記，7 天內不再顯示，逾期後若仍未安裝才重新出現。
- **推播通知（Web Push）**：新增 `PushSubscription` 資料表儲存瀏覽器推播訂閱資訊；新增 `app/actions/push-subscription.ts`（`subscribeToPush`／`unsubscribeFromPush`）；於既有通知 Drawer（`notification-inbox`）新增「啟用推播通知」開關；**擴充既有唯一寫入通知的 `createNotification()`（`app/actions/notification.ts`）**，於寫入 `Notification` 記錄後，一併對該使用者所有有效的 `PushSubscription` 呼叫 `web-push` 套件送出推播——由於既有 13 處呼叫通知建立的地方（含新版「站內訊息」`app/actions/conversation.ts`）全部集中經過此單一函式，此為唯一需要修改的送出點，無需逐一改動呼叫端。
- **相依套件**：新增 `web-push`（伺服器端送出推播）；環境變數新增 `VAPID_PUBLIC_KEY`／`VAPID_PRIVATE_KEY`／`VAPID_SUBJECT`。

## Capabilities

### New Capabilities
- `pwa-install`：manifest／圖示／service worker 註冊／啟動方式偵測／安裝說明頁／登入首頁安裝提醒橫幅。
- `push-notifications`：Web Push 訂閱管理、`createNotification()` 觸發推播送出、失效訂閱清除。

### Modified Capabilities
- `notification-inbox`：Drawer 內新增「啟用推播通知」開關（訂閱／取消訂閱狀態切換）。

## Impact

- **Affected code**：
  - 新增：`app/manifest.ts`、`app/icon-192/route.tsx`、`app/icon-512/route.tsx`、`public/sw.js`、`app/[locale]/(guest)/pwa-install/page.tsx`、`hooks/use-is-standalone.ts`、`components/pwa/install-banner.tsx`、`components/pwa/pwa-register.tsx`、`components/pwa/push-toggle.tsx`、`app/actions/push-subscription.ts`、`lib/data/push-subscription.ts`
  - 修改：`app/actions/notification.ts`（`createNotification` 內加入推播送出）、`app/[locale]/(user)/user/[spiritId]/page.tsx`（掛載安裝提醒橫幅）、`app/[locale]/(guest)/page.tsx`（加入安裝說明連結）、`lib/auth/route-access.ts`（註冊 `/pwa-install` 為免登入頁）、`components/notification/notification-drawer.tsx`（掛載推播開關）、`app/[locale]/layout.tsx`（掛載 `pwa-register`，於 `<head>` 加入 manifest/theme-color meta）、`middleware.ts`（matcher 排除 PWA 特殊檔案，見 design.md Decision 8，實作階段發現的必要修正）
- **Database**：新增 migration，新增 `PushSubscription` model（`userId`／`endpoint`／`p256dh`／`auth`／`userAgent`／`createdAt`，`endpoint` 唯一）。屬新增資料表，不影響既有資料相容性（符合 [[production-data-compat]]）。
- **Dependencies**：新增 `web-push`（及對應 `@types/web-push`）。
- **Docs**：依 CLAUDE.md 第 9 點檢查 `doc/學員手冊.md`／`doc/老師手冊.md`／`doc/管理者操作手冊.md` 是否需補充「安裝到手機桌面」與「推播通知」說明。
- **i18n**：安裝提醒橫幅、安裝說明頁、推播開關文案需依 CLAUDE.md 第 12 點加入 `messages/zh-TW.json`（新命名空間 `pwa`）並補英文翻譯；簡體由 `npm run gen:zh-cn` 自動產生。

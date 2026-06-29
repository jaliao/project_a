## 1. 訊息命名空間擴充

- [x] 1.1 `messages/zh-TW.json` 新增 feature 命名空間：`account`、`onboarding`、`recover`、`notifications`、`invites`、`learning`、`matchBoard`
- [x] 1.2 `messages/en.json` 補對應英文草稿
- [x] 1.3 `npm run gen:zh-cn` 重產 `messages/zh-CN.json`

## 2. 未登入流程頁面遷移

- [x] 2.1 `login` 頁殘留（標題/副標/條款連結/註冊連結）→ `account.login`（server `getTranslations`）
- [x] 2.2 `register` 頁 + 表單（標題/說明/按鈕/條款/成功 Dialog）
- [x] 2.3 `forgot-password` 頁 + 表單（標題/說明/成功提示/按鈕）
- [x] 2.4 `reset-password` 頁 + 表單（標題/欄位/無效連結/按鈕）
- [x] 2.5 `recover-account` 頁 + 表單（各步驟標題/說明/欄位/按鈕/完成畫面）→ `recover`（動作層 server 訊息保留）
- [x] 2.6 `onboarding` 頁 + wizard（步驟標題/欄位/性別/教會/品牌引言/登出/出生年 ICU 參數）→ `onboarding`
- [x] 2.7 terms/privacy 連結文字在地化；法律長文不動

## 3. 小型會員頁遷移

- [x] 3.1 `notifications` 頁（標題/空狀態/已讀/分頁 ICU summary/上下頁）
- [x] 3.2 `invites` 頁（標題/空狀態/人數 ICU/教材訂單 ICU/表頭）
- [x] 3.3 `learning` 頁（三區塊標題/空狀態/表頭/人數 ICU）
- [x] 3.4 `match-board` 頁（標題/說明/空狀態）

## 4. 版本與文件

- [x] 4.1 `config/version.json` 0.1.103 → 0.1.104；README-AI 當前任務同步

## 5. 驗證

- [x] 5.1 `npm run gen:zh-cn`、`npm run build`（✓ Compiled）、`npm run lint`（0 errors）通過
- [x] 5.2 grep 各目標檔殘留中文抽查：JSX 文字/屬性無遺漏（品牌/註解/terms-privacy 長文除外）
- [ ] 5.3 （執行階段，使用者）`/en`、`/zh-CN` 抽查未登入流程與小型會員頁呈現；未遷移處回退繁體

> 註：date-fns 相對時間仍以 zhTW locale 顯示（日期格式在地化屬後續另案）；recover/onboarding 之 server-action 動態訊息維持原樣（動作層）。

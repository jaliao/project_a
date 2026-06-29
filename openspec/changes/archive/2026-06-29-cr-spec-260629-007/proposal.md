## Why

多語系第二階段（`cr-spec-260629-006`）已完成共用基礎批（命名空間、驗證訊息 key 化、共用標籤/元件）。本變更承接「會員前台批」的**第一個子批**：把**未登入流程頁面文字**與**小型會員頁**的 feature 字串遷移至 i18n，讓使用者最先接觸的入口流程（登入/註冊/找回帳號/首次設定）在三語下完整在地化。課程網域與個人資料頁因量大、術語多，留待後續子批；terms/privacy 法律長文維持繁體（屬法務內容，不在地化）。

## What Changes

- **未登入流程頁面文字**（沿用 `<FieldError>`/`common`/`nav`，新增 feature 命名空間）：
  - `login` 頁殘留（標題/副標/條款連結文字/「立即註冊」等）
  - `register`、`forgot-password`、`reset-password`、`recover-account`、`onboarding` 各頁之**標題、說明、按鈕、placeholder、步驟文案**
- **小型會員頁**：`notifications`、`invites`、`learning`、`match-board` 的 feature 字串
- 新增 feature 命名空間（如 `account`、`onboarding`、`recover`、`notifications`、`learning`、`matchBoard`），zh-TW 來源 + en 草稿，zh-CN OpenCC 自動。
- **明確不在本批**：course 網域（pages + components，留 008）、profile/user 頁面標籤（留後續）、`terms`/`privacy` 法律長文（維持繁體）、整個後台、信件。

> 沿用既有缺 key 回退繁體；未遷移處不退化。

## Capabilities

### New Capabilities

- `i18n-member-entry`: 未登入流程頁面與小型會員頁的 UI 文案在地化規範與覆蓋範圍（feature 命名空間、哪些頁納入/排除）。

### Modified Capabilities

- `i18n-messages`: 訊息目錄新增本批 feature 命名空間（`account`/`onboarding`/`recover`/`notifications`/`learning`/`matchBoard` 等）。

## Impact

- 訊息檔：`messages/zh-TW.json`、`messages/en.json` 擴充 feature 命名空間；`zh-CN.json` 重產。
- 頁面/元件：`(guest)/login|register|forgot-password|reset-password|recover-account|onboarding`、`(user)/notifications|invites|learning|match-board` 及其專屬元件（`components/notification`、`components/course-invite` 中與邀請/通知相關者）。
- 準則：沿用 CLAUDE.md 第 12 條，無新增規範；`config/version.json` patch +1。
- 風險：onboarding/recover 為多步驟流程，字串較分散，需逐步驟覆核；terms/privacy 明確排除避免法務誤譯。

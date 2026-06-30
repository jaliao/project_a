## Why

多語系會員前台批子批 1（`cr-spec-260629-007`）已完成未登入流程與小型會員頁。本變更承接**課程網域**——使用者最核心的瀏覽/詳情/報名體驗——的 UI 文案在地化。課程網域字串量大（~467 行），故本批聚焦「課程瀏覽與詳情」核心（課程頁、`course-session` 元件、FAQ、課程目錄徽章周邊），將**教材訂購（`course-order`）與邀請相關元件（`course-invite`）留待子批 3（009）**。

## What Changes

- 在地化**課程頁**：`course/[id]`（詳情）、`course/[id]/graduate`（結業表單）、`course-sessions`（查詢）的 UI 文案（標題、區塊標題、欄位標籤、按鈕、狀態說明、空狀態）。
- 在地化 **`components/course-session`**：課程卡、課程詳情子元件、開課精靈（create-course-wizard）、狀態選單等的靜態 UI 文案。
- 在地化 **`components/course-faq`** 與 **`components/course-catalog`** 的靜態 UI 文案。
- 新增 `course` feature 命名空間（必要時含 `course.detail`/`course.graduate`/`course.wizard`/`course.faq` 等子命名空間）；zh-TW 來源 + en 草稿，zh-CN OpenCC 自動。
- 沿用既有模式：server `getTranslations` + `generateMetadata`、client `useTranslations`、共用 `<FieldError>`、動態文案 ICU 參數。

> **不在本批**：`components/course-order`（教材訂購/付款，~51）與 `components/course-invite`（邀請操作，~23）→ 009；**與後台共用的 `course-*` Zod schema 驗證訊息維持不變**（避免後台顯示原始 key，沿用 006 之決策）；使用者產生內容（課程名、講師名、備註）與 date-fns 相對時間不在地化；後台維持繁體。

## Capabilities

### New Capabilities

- `i18n-course`: 課程瀏覽/詳情/報名體驗的 UI 文案在地化規範與覆蓋範圍（課程頁、`course-session`/`course-faq`/`course-catalog` 元件；明列納入/排除）。

### Modified Capabilities

- `i18n-messages`: 訊息目錄新增 `course`（及其子）命名空間。

## Impact

- 訊息檔：`messages/zh-TW.json`、`messages/en.json` 新增 `course`；`zh-CN.json` 重產。
- 頁面/元件：`(user)/course/[id]`、`(user)/course/[id]/graduate`、`(user)/course-sessions` 及 `components/course-session/*`、`components/course-faq/*`、`components/course-catalog/*` 的靜態文案。
- 準則：沿用 CLAUDE.md 第 12 條；`config/version.json` patch +1。
- 風險：course-session 元件多且互相關聯（卡片/詳情/精靈），需分階段 build；shared schema 驗證不動以免後台破版；量大需逐元件覆核避免遺漏。

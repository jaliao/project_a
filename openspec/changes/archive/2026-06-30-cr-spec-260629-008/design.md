## Context

i18n 基礎（004）、共用基礎批（006）、會員前台子批 1（007）已完成。本批處理課程網域核心（瀏覽/詳情/報名）。約束沿用：與後台共用的 `course-*` Zod schema（course-session/order）**驗證訊息不 key 化**（避免後台顯示原始 key）；course 頁多為 server component，互動子元件為 client；使用者產生內容與 date-fns 相對時間不在地化。

## Goals / Non-Goals

**Goals:**
- 在地化課程頁（course/[id]、graduate、course-sessions）與 `course-session`/`course-faq`/`course-catalog` 元件的靜態 UI 文案。
- 新增 `course` 命名空間；沿用 server/client 取用模式與 ICU 參數。

**Non-Goals:**
- 不含 `course-order`、`course-invite`（→ 009）。
- 不 key 化共用 `course-*` schema 驗證訊息。
- 不在地化內容資料（課程名/講師名/備註）與相對時間。
- 後台維持繁體。

## Decisions

- **命名空間：** `course`，必要時分子鍵：`course.detail`（詳情頁）、`course.graduate`（結業表單）、`course.sessions`（查詢頁）、`course.card`（課程卡）、`course.wizard`（開課精靈）、`course.faq`、`course.actions`（共用按鈕/狀態說明）。狀態徽章已於 006 用 `status` 命名空間。
- **server/client：** 頁面與 metadata 用 `getTranslations({ locale, namespace })`（取 `params.locale`）；client 子元件用 `useTranslations(ns)`。
- **shared schema 驗證：** create-course-wizard 等若用 course-session schema，其驗證訊息維持原樣（本批僅遷靜態 UI）；於 tasks 標示不動。
- **動態文案：** 人數、日期區間、剩餘名額等以 ICU 參數；內容值（課程名等）原樣插入。
- **英文：** 我出草稿，使用者校訂；簡體 OpenCC。

## Risks / Trade-offs

- [course-session 元件多且關聯（卡片/詳情/精靈/狀態）] → 分階段遷移並逐段 build；先頁面、再元件群、再 faq/catalog。
- [誤動共用 schema 驗證造成後台破版] → 嚴守「只遷靜態 UI」；不碰 lib/schemas。
- [遺漏字串] → 完成後 grep 目標檔殘留中文（扣註解/內容/品牌）抽查；缺 key 回退繁體不破版。

## Migration Plan

1. 擴充 `messages/zh-TW.json` + `en.json`（`course` 命名空間）→ `gen:zh-cn`。
2. 課程頁（detail/graduate/sessions）。
3. `components/course-session/*`（卡片→詳情子元件→精靈→狀態）。
4. `components/course-faq/*`、`components/course-catalog/*`。
5. `config/version.json` +1；README 同步；build/lint + grep 抽查。
回退：還原各檔字串與訊息檔。

## Open Questions

- create-course-wizard 的驗證訊息 key 化時程——隨 course-session schema 整體（含後台）另案處理。

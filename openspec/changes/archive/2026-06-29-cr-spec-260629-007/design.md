## Context

i18n 基礎（004）與共用基礎批（006）已就緒：`app/[locale]`、next-intl、`messages/`（zh-TW 來源 + en + zh-CN OpenCC）、缺 key 回退繁體、`common`/`nav`/`validation`/`status`/`role` 命名空間、`<FieldError>`。本批遷移「未登入流程頁面 + 小型會員頁」的 feature 文案。頁面多為 server component（標題/metadata），表單區為 client component。

## Goals / Non-Goals

**Goals:**
- 未登入流程（login 殘留／register／forgot／reset／recover／onboarding）頁面文案在地化。
- 小型會員頁（notifications／invites／learning／match-board）文案在地化。
- 新增 feature 命名空間，沿用既有模式（server `getTranslations`、client `useTranslations`、`<FieldError>`）。

**Non-Goals:**
- 不含 course 網域（008）、profile/user 頁、後台、信件。
- 不在地化 `terms`/`privacy` 法律長文（維持繁體）。
- 不改既有資料/邏輯，僅文案。

## Decisions

- **命名空間切分（feature）：** `account`（登入/註冊/共用帳號頁文案）、`onboarding`（首次設定 wizard 步驟文案）、`recover`（找回帳號流程）、`notifications`、`invites`、`learning`、`matchBoard`。共用詞續用 `common`/`nav`。
- **server vs client：** 頁面 metadata 與 server component 文案用 `getTranslations({ locale, namespace })`（需 `params.locale`）；client 表單/互動用 `useTranslations(ns)`。
- **動態/變數文案：** 以 next-intl ICU 參數（`t('key', { n })`）處理（如「剩餘 N 次」「第 X / Y 步」）。
- **recover-account 既有 server-action 訊息：** `findRecoverableAccount` 等回傳的提示（查無/多筆同名/答錯次數）目前為動作層字串；本批將前端**呈現端**文案 key 化，動作層訊息酌情改回傳 key 或保留（以不破壞為原則，於 tasks 標示）。
- **terms/privacy 連結文字**（在 login/register 頁）可在地化；但 terms/privacy **頁面內法律長文**不動。
- **英文**：我出草稿、使用者校訂；簡體 OpenCC。

## Risks / Trade-offs

- [onboarding/recover 多步驟字串分散] → 逐步驟覆核；以命名空間集中。
- [server component 需 locale 參數] → 由 `[locale]` 路由參數取得；頁面已在該段下。
- [漏遷字串] → 完成後 grep 各目標檔殘留中文（扣註解）抽查；缺 key 回退繁體不破版。

## Migration Plan

1. 擴充 `messages/zh-TW.json` + `en.json`（feature 命名空間）→ `gen:zh-cn`。
2. 遷移未登入流程頁（含 metadata 與表單非驗證文案）。
3. 遷移小型會員頁。
4. `config/version.json` +1；README 同步；build/lint。
回退：還原各檔字串與訊息檔。

## Open Questions

- recover 動作層訊息是否本批一併 key 化（傾向是，但若牽動過廣則留下一批）——實作時依範圍控制。

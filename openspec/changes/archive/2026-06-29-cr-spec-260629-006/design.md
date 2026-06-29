## Context

Phase 1 已就緒（next-intl、`app/[locale]`、`messages/`、OpenCC、缺 key 回退繁體、登入切片）。剩餘字串散落（components ~576、(user) ~347、(guest) 其餘 ~298、(admin) ~186、Zod ~116、mailer ~29）。關鍵約束：部分 label map（`ROLE_LABELS`、`STATUS_LABELS`）與 schema（course-session/order）**跨前台與後台共用**，且 `ROLE_LABELS` 亦用於非 React 的 Excel 匯出路由。後台與信件本期不在地化。

## Goals / Non-Goals

**Goals:**
- 建立共用命名空間（common/nav/validation/status/role/catalog）。
- 定案並參考實作兩特殊模式：Zod 驗證訊息 key 化、enum/標籤 i18n 化。
- 遷移跨域共用元件字串；不破壞後台（維持繁體）。

**Non-Goals:**
- 不遷移後台頁 `(admin)`、`components/admin` 與信件。
- 不遷移與後台共用的 schema（course-session/order/invite/message）—— 留待其前台批。
- 不翻譯使用者產生內容。

## Decisions

- **驗證訊息（模式 A）：** Zod 訊息字串改為 `validation.*` key（如 `validation.realNameRequired`）。
  - client：RHF zodResolver 產生 `error.message`＝key，呈現處 `const t = useTranslations('validation'); t(error.message)`（或以完整 key + 根 `t`）。
  - server action：回傳的 `errors` 內為 key，client 呈現端同樣 `t()`。
  - **範圍限制**：本批僅 `auth.ts`、`profile.ts`（純前台）。共用 schema 不動，避免後台表單顯示原始 key。
  - 替代：Zod 全域 errorMap——較全面但跨 client/server 接線複雜，且會波及後台；不採。
- **enum/標籤（模式 B）：** 共用 **React 顯示**元件改用 i18n。
  - `course-status-badge`、`course-catalog-badge`、前台身分標籤：改 `useTranslations('status'|'catalog'|'role')`；隨當前語言呈現（後台頁沿用這些元件亦自然在地化，屬可接受的一致行為）。
  - **非 React 保留 map**：`ROLE_LABELS` 供 `/api/admin/members/export`（無 i18n 情境）續用；不移除。轉換規範：React 顯示用 i18n、非 React/匯出用 map。
- **共用字串（common/nav）：** 跨域共用按鈕、空狀態、toast、側邊/導覽改 `common`/`nav`。feature 專屬留 007。
- **英文**：我填 en 草稿，使用者校訂；zh-CN 由 `gen:zh-cn` 重產。
- **缺 key 回退**：沿用 Phase 1 deepMerge（未遷移處顯示繁體）。

## Risks / Trade-offs

- [key 化但呈現端未同批遷移 → 顯示原始 key] → 嚴格限定 in-scope（前台 + auth/profile schema），共用 schema/後台不動。
- [label 元件 i18n 後，後台也隨語言變動] → 可接受（一致）；唯匯出路由用 map 保持繁體。
- [en 草稿品質] → 標記待校訂；缺/疑慮處回退繁體不致破版。

## Migration Plan

1. 擴充 `messages/zh-TW.json` + `en.json`（6 命名空間）→ `gen:zh-cn`。
2. `auth.ts`/`profile.ts` 訊息改 key；對應前台表單錯誤呈現改 `t()`。
3. 共用 label 元件改 i18n（保留 `ROLE_LABELS` map 給匯出）。
4. 共用 common/nav 元件遷移。
5. `CLAUDE.md` 補子規範；version +1；build/lint。
回退：還原 schema/元件字串與訊息檔。

## Open Questions

- 共用 schema（course-session/order）的驗證 key 化時程——隨其前台批（007+）處理。

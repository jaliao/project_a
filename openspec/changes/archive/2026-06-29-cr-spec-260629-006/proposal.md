## Why

多語系 Phase 1（`cr-spec-260629-004`）已建立 next-intl 基礎建設與登入切片，但 ~1,400 行 UI 字串仍為寫死繁體。第二階段需漸進遷移；本變更為**共用基礎批**：建立跨頁共用的訊息命名空間、定案兩個特殊類別（Zod 驗證訊息、enum/標籤）的遷移模式並做參考實作，讓後續「會員前台批」有 key 與模式可循。後台（`(admin)`）與信件本期不在地化（依決策）。

## What Changes

- **訊息命名空間**：新增 `common`（儲存/取消/刪除/確認/返回/載入中/搜尋…）、`nav`、`validation`、`status`、`role`、`catalog`（zh-TW 來源 + en 草稿；zh-CN OpenCC 自動）。
- **模式 A — Zod 驗證訊息（key 化）**：驗證訊息改為 `validation.*` key；client 表單以 `t(error.message)` 呈現、server action 回傳 key 由呈現端翻譯。本批**僅套用前台專用 schema**（`auth`、`profile`）作參考實作；與後台共用的 schema（course-session/order 等）留待對應前台批，避免後台顯示原始 key。
- **模式 B — enum/標籤（i18n 呈現）**：共用 **React 顯示**元件（課程狀態 `course-status-badge`、書別 `course-catalog-badge`、前台身分標籤）改用 `status`/`catalog`/`role` 命名空間翻譯，隨當前語言呈現。**非 React 情境保留既有 map**：`lib/auth-roles.ts` `ROLE_LABELS` 供 Excel 匯出（`/api/admin/members/export`）續用。
- **共用元件文字**：側邊／導覽與跨域共用按鈕/空狀態/toast 改用 `common`/`nav`。feature 專屬元件（course/admin 細節）留給 007。
- **英文**：我填 `en.json` 草稿、你校訂；簡體自動。

> 不破壞既有：未遷移處（含整個後台、共用 schema 的後台表單）維持繁體；遷移採缺 key 回退繁體，行為不退化。

## Capabilities

### New Capabilities

- `i18n-validation-messages`: Zod 驗證訊息以 `validation.*` key 表示、由 i18n 於呈現端解析（client/server 皆可）；定義跨 client/server 的驗證訊息在地化契約。
- `i18n-enum-labels`: 共用 enum/狀態/身分/書別標籤於 **React 顯示**改以 i18n 命名空間呈現；非 React（匯出）保留 map 的轉換規範。
- `i18n-common-strings`: `common`/`nav` 共用命名空間與跨域共用元件的字串遷移規範。

### Modified Capabilities

- `i18n-messages`: 既有「訊息目錄與唯一事實來源」需求新增 `common`/`nav`/`validation`/`status`/`role`/`catalog` 命名空間（zh-TW 來源、en 翻譯、zh-CN 自動）。

## Impact

- 訊息檔：`messages/zh-TW.json`、`messages/en.json` 擴充命名空間；`zh-CN.json` 重新產生。
- Schema：`lib/schemas/auth.ts`、`lib/schemas/profile.ts` 訊息改 key。
- 顯示端：對應前台表單錯誤呈現改 `t()`；`components/course-session/course-status-badge.tsx`、`course-catalog-badge.tsx`、前台身分標籤元件改 i18n；側邊/導覽共用元件。
- 保留：`ROLE_LABELS` map（匯出路由）、後台頁、信件文案維持繁體。
- 準則：`CLAUDE.md` 第 12 條補充驗證/標籤子規範；`config/version.json` patch +1。
- 風險：驗證 key 化與 label i18n 化需確保「呈現端同批遷移」否則顯示原始 key；故嚴格限定在前台 in-scope 範圍，後台/共用 schema 不動。

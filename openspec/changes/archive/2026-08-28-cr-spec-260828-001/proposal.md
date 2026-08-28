## Why

需求單 CR-SPEC-260828-001（提出人：廖柏嘉 Justin，2026-08-28）：個人資料頁「基本資料」區塊的「真實姓名」欄位標籤，對只有英文護照拼音姓名的使用者不夠清楚，容易誤以為一定要填中文字。要求把標籤文字改為明確指引：

> 中文姓名（若無中文姓名請填上您護照上的拼音姓名）

這是純文案（改字）調整，不動資料模型、驗證規則或欄位行為。

## What Changes

- 個人資料頁（實際路由 `/user/[spiritId]/profile`，`app/[locale]/(user)/user/[spiritId]/profile/profile-form.tsx`）「基本資料」區塊中，綁定 `realName` 的輸入欄位標籤由「真實姓名 *」改為「中文姓名（若無中文姓名請填上您護照上的拼音姓名） *」。
- 欄位本身不變：仍對應 `realName`、仍為必填、驗證與送出流程完全不動。
- 個人資料頁表單標籤為既有寫死字串（此表單尚未 i18n 化），本次直接更新寫死字串。實作查證：`messages/*.json` 並無 `profile` 命名空間，唯一 `realName` 相關鍵為 `onboarding.realName`（onboarding 精靈用，範圍外）與 `validation.realName*`（文字未變），故無 i18n 訊息鍵需同步。
- **不影響**註冊 / onboarding 精靈（`onboarding.realName`，另一組鍵、另一個流程）與後台會員管理、證書製作等處的「真實姓名」用語——需求僅針對個人資料頁基本資料區塊。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `user-profile`：新增一條需求，規範個人資料頁基本資料區塊中文姓名欄位的標籤文字。

## Impact

- **Affected code**：
  - `app/[locale]/(user)/user/[spiritId]/profile/profile-form.tsx`（第 190 行標籤字串）
  - `app/[locale]/(user)/profile/profile-form.tsx`（舊路徑、目前無任何 import 引用的殘留檔；為避免日後誤導一併同步）
- **Database**：無 schema 變更。
- **Docs**：依 CLAUDE.md 第 9 點，`doc/學員手冊.md`（第 82、95、104、262 行提及「真實姓名」處，屬個人資料頁情境）需同步字樣；`doc/管理者操作手冊.md` 內「真實姓名」多指後台／證書情境，非本次範圍，逐條確認後多數不需改。
- **Version**：apply 時依 CLAUDE.md 第 7 點將 `config/version.json` patch +1、更新 `updatedAt`。
- **Dependencies**：無新增套件。

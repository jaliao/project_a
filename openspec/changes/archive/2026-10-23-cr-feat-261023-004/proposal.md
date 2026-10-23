## Why

`User` 資料模型已有 `gender`（Gender enum：male/female/unspecified）與 `churchType`/`churchId`/`church`/`churchOther`（所屬教會/單位，三態：教會/其他自填/無）欄位，後台「會員詳情」頁已會顯示這兩項資料，但學員首頁（`/user/{spiritId}`）「基本資料」卡片目前只顯示姓名、Spirit ID、身分標籤，缺少性別與所屬教會，使用者需要能在首頁直接看到這兩項資訊。

## What Changes

- 「基本資料」區塊新增兩列：**性別**（顯示圖示＋文字：男／女／未設定）、**所屬教會**（`churchType === 'church'` 顯示 `church.name`；`churchType === 'other'` 顯示 `churchOther`；否則顯示「未設定」）。
- 對所有檢視者（本人與他人）皆公開顯示，與其他基本資料欄位（姓名、身分標籤、學習進度）的公開程度一致（使用者已確認不需隱私限制）。
- 新增文案一律透過 i18n key 呈現（`studentProfile` 命名空間），不寫死中文。

## Capabilities

### Modified Capabilities
- `student-profile-page`：「基本資料區塊」新增性別與所屬教會顯示 Requirement。

## Impact

- **前端**：`app/[locale]/(user)/user/[spiritId]/page.tsx` 的 `prisma.user.findUnique` select 已含 `gender`（既有，用於性別補填對話框判斷），需新增 select `churchType`、`churchOther`、`church.name`；基本資料區塊新增兩列渲染，重用既有 `GenderIcon`（`components/shared/gender-icon.tsx`）。
- **i18n**：`messages/{zh-TW,en,zh-CN}.json` 的 `studentProfile` 命名空間新增性別／教會欄位標籤與列舉文字。
- 不涉及資料庫 schema 變更、不涉及 Server Action、不影響既有查詢的其他用途。

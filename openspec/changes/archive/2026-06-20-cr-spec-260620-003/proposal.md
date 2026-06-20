## Why

介面上的人名顯示目前不一致：部分位置用 `getMemberDisplayName`，部分直接用 `user.name ?? email` 或 `realName ?? name`，且現行顯示模式僅 `chinese`／`english`、UI 文字仍稱「匿名」。**基於資安/隱私**，使用者可自行決定對外呈現的名稱，系統不得在介面直接曝露**真實姓名**作為身分顯示。故將「顯示名稱」訂為**系統標準之一**：所有呈現**人名**的位置（課程頁面、後台學員/會員頁面、清單、樹狀圖、留言…等一切介面）一律改用單一顯示名稱規則與標準元件，邏輯集中、可維護、可稽核。（**Email 不在此限**：作為課程聯繫用途，仍照常顯示。）

## What Changes

- **顯示名稱規則重新定義**：基底為**暱稱**，未填則退回**中文名稱**（`realName`），再退回**英文名稱**（`englishName`），皆無則「（未填）」。
- **三種顯示模式**（取代現行 `chinese`／`english`）：
  - 暱稱（僅暱稱）— **預設**
  - 暱稱（中文名稱）— 暱稱（`realName`）
  - 暱稱（英文名稱）— 暱稱（`englishName`）
- **BREAKING** `DisplayNameMode` enum 由 `chinese`／`english` 改為 `nickname`（預設）／`nickname_zh`／`nickname_en`。
- **標準元件（系統標準）**：邏輯集中於 `lib/utils/member-display.ts`（`getMemberDisplayName`）與 `components/member/member-display-name.tsx`（`MemberDisplayName`）；介面上**所有**人名顯示一律改用此元件/工具，移除散落的 `name ?? email`、`realName ?? name` 等直接拼接。**基於資安，UI SHALL NOT 直接以 `realName` 作為身分名稱顯示**；名稱全空時顯示「（未填）」，**不以 Email 充當名稱**。**Email 本身仍可顯示**（作為聯繫資訊，通常於名稱下方獨立呈現）。
- **文字修正**：個人資料「顯示名稱方式」選項與相關說明由「匿名…」改為「暱稱…」；移除程式註解中的「匿名名稱」用語。

## Capabilities

### New Capabilities
- `display-name`: 顯示名稱的單一規則與標準元件（**系統標準/資安**）——三種模式（暱稱／暱稱(中文名稱)／暱稱(英文名稱)，預設暱稱）、暱稱→中文名稱→英文名稱的退回順序、格式化規則；強制約束「介面上所有人名一律使用顯示名稱元件，SHALL NOT 直接以 `realName` 作為名稱顯示、不以 Email 充當名稱」（Email 作為聯繫資訊仍可獨立顯示）；含個人資料的顯示名稱方式選擇器（使用「暱稱」用語）。

### Modified Capabilities
<!-- 顯示模式邏輯與選擇器集中於新 display-name capability；現有規格僅「使用顯示名稱」，行為相容，不另列。 -->

## Impact

- **資料模型**：`prisma/schema/user.prisma` 的 `DisplayNameMode` enum（`nickname`/`nickname_zh`/`nickname_en`，預設 `nickname`）；migration。系統未上線，開發資料庫可重建並重新 seed，不需既有資料遷移（既有 `chinese`/`english` 以重建處理）。
- **核心邏輯/元件**：`lib/utils/member-display.ts`（重寫規則、移除「匿名」用語）、`components/member/member-display-name.tsx`（型別更新為新模式）。
- **個人資料表單**：`app/(user)/profile/profile-form.tsx`、`app/(user)/user/[spiritId]/profile/profile-form.tsx`（三選項、暱稱用語、預覽）、`lib/schemas/profile.ts`（`displayNameMode` 列舉）。
- **介面名稱顯示稽核**：改用 `MemberDisplayName`/`getMemberDisplayName` 之處包含 `app/(user)/course/[id]/page.tsx`、`pending-enrollment-list.tsx`、`invites/page.tsx`、`learning/page.tsx`、`admin/members` 等（移除 `name ?? email` 直接拼接）。
- **Seed**：`prisma/seed.ts` 若有設定 `displayNameMode` 需對齊新值。
- **文件**：`doc/學員手冊.md`／`doc/管理者操作手冊.md`（顯示名稱說明）、`config/version.json`、`README-AI.md`。

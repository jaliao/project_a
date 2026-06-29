## Why

新會員首次登入的 onboarding 僅收集真實姓名與手機，缺少性別、出生年、所屬教會等基礎會員資訊，導致名冊與後續服務資料不完整。需在首次登入流程補齊這三項必填資訊；其中「出生年」為全新欄位，並須可於個人資料頁維護。

## What Changes

- Onboarding Step 2「填寫基本資料」新增三個**必填**欄位：**性別**、**出生年**、**所屬教會**（連同既有的真實姓名、手機）。
  - 性別必填代表須選擇「男／女」，不接受「未指定」作為通過值。
  - 所屬教會必填代表須為「清單教會（含 churchId）」或「其他（含自填名稱）」，不接受「無」。
- 新增 `User.birthYear` 欄位（**西元年 4 位數整數，可為空**），於 onboarding 必填，並可於個人基本資料頁維護。
- 個人基本資料頁（profile-form）新增「出生年」維護欄位（性別、所屬教會原已可維護）。
- **不強制既有會員補填**：三項必填僅作用於新會員 onboarding 流程；既有已完成首次登入的會員不會被導回 onboarding，可自行於個人資料頁補填（非破壞性）。

## Capabilities

### New Capabilities

- `member-birth-year`: 會員出生年欄位（`User.birthYear`，西元年整數、可空）；onboarding 必填、個人資料頁可維護、範圍驗證（合理年份區間）。

### Modified Capabilities

- `onboarding-wizard`: 修改「Step 2 — 填寫基本資料」需求，新增性別、出生年、所屬教會三項必填欄位與對應驗證。

## Impact

- 資料模型：`prisma/schema/user.prisma` 新增 `birthYear Int?`；需 migration（`make schema-update`）。
- Onboarding：`app/onboarding/onboarding-wizard.tsx`（Step 2 表單）、`app/actions/auth.ts`（`completeOnboardingProfile` 驗證與儲存）。
- 個人資料：`lib/schemas/profile.ts`（`updateProfileSchema` 加 `birthYear`）、`app/(user)/profile/profile-form.tsx` 與 `app/(user)/user/[spiritId]/profile/profile-form.tsx`、`app/actions/profile.ts`。
- 教會選擇：onboarding Step 2 沿用既有 `churchType`/`churchId`/`churchOther` 與教會清單資料（`lib/data/churches.ts`）。
- 既有會員：onboarding 放行條件（`app/onboarding/page.tsx`）維持以 `realName` + `phone` 判定，不納入新欄位，避免既有會員被導回。
- 操作手冊：更新 `doc/學員手冊.md`（首次登入設定章節新增三欄位、個人資料可維護出生年）。

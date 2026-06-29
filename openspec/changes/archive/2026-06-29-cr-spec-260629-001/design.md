## Context

新會員首次登入由 `/onboarding` 三步驟 Wizard 引導（密碼 → 基本資料 → 歡迎）。目前 Step 2 僅收集 `realName` 與 `phone`（`completeOnboardingProfile` action）。User model 已具 `gender`（`Gender` enum，預設 `unspecified`）與所屬教會欄位（`churchType`/`churchId`/`churchOther`），且個人資料頁（`profile-form.tsx`）已可維護兩者；教會清單由 `lib/data/churches.ts` 提供。`birthYear` 為全新欄位，尚不存在。`/onboarding` 放行條件目前以 `!isTempPassword && realName && phone` 判定。

## Goals / Non-Goals

**Goals:**
- 於 onboarding Step 2 收集性別、出生年、所屬教會並設為必填。
- 新增 `User.birthYear`（西元年整數、可空），可於個人資料頁維護並做範圍驗證。
- 沿用既有 `gender`/`church*` 欄位與教會清單資料，不重複建模。

**Non-Goals:**
- 不強制既有已完成首次登入的會員回填（非破壞性）。
- 不改動 Step 1（密碼）、Step 3（歡迎）流程。
- 不調整 Dashboard 資料完整度提醒（`ProfileBanner`）的判定欄位。

## Decisions

- **`birthYear` 型別採 `Int?`（西元年 4 位數），DB 可空。**
  - 理由：依使用者確認採西元年；既有會員無此資料，故 DB 必須可空，避免 migration 對既有列失敗或被迫回填。必填僅在 onboarding 表單層強制。
  - 替代方案：(a) 完整 `DateTime` 出生日期——超出「出生年」需求、UI 較複雜；(b) `NOT NULL` 預設值——既有資料語意錯誤（假年份）。
- **性別「必填」= 須選 `male`／`female`，排除 `unspecified` 作為通過值（僅 onboarding）。**
  - 理由：`unspecified` 是「未填」語意，必填即不可停留於此。個人資料頁維持可選 `unspecified` 不變。
- **所屬教會「必填」= `churchType` 須為 `church`（含 `churchId`）或 `other`（含 `churchOther`），排除 `none`。** 沿用既有 superRefine 驗證再加 `none` 拒絕（onboarding 專用）。
- **onboarding 放行條件不納入新欄位。** `/onboarding` 仍以 `realName && phone` 判定完成，新欄位只在 Step 2 表單提交時驗證。
  - 理由：既有會員 `isTempPassword=false` 本就跳過 onboarding；若把新欄位納入放行判定，會把缺欄位的既有會員導回，違反「不強制回填」決策。
- **出生年範圍驗證**：合理區間（例如 1900 ~ 當年）於 Zod 與 action 同步把關，避免無效年份。
- **個人資料頁三檔同步**：`app/(user)/profile/profile-form.tsx` 與 `app/(user)/user/[spiritId]/profile/profile-form.tsx` 皆加出生年欄位，行為一致。

## Risks / Trade-offs

- [新增 enum/欄位非破壞，但 `birthYear` 範圍驗證若過嚴可能擋掉合理輸入] → 採寬鬆合理區間（1900~當年），前後端一致。
- [onboarding 與 profile 兩處驗證規則需一致] → 共用 `lib/schemas` 邏輯，onboarding 額外疊加「性別非 unspecified、教會非 none」的嚴格層。
- [既有會員未回填新欄位，名冊仍有空值] → 屬預期；可由個人資料頁補填，後續若需強制再另開變更。

## Migration Plan

- `prisma/schema/user.prisma` 新增 `birthYear Int?` → `make schema-update name=add_user_birth_year`（DB 走容器內網）。欄位可空，對既有列無影響、可安全部署；回退僅需移除欄位與相關表單/驗證。

## Open Questions

- 無（出生年格式與既有會員回填策略已由使用者確認）。

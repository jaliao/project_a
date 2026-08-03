## Why

目前「性別」欄位（`User.gender`）雖然在首次登入 Onboarding Wizard 已列為必填，但既有帳號（Onboarding 上線前建立、或事後於個人資料頁改回「未設定」）仍可能停留在 `unspecified`，且沒有任何機制提醒這些「已經完成首次填寫」的既有會員回頭補填。

需求單原文提出兩個訴求：「性別是否可以鎖定」與「未填的跳出來詢問、填寫」。經與提出人（Justin）確認：
- 「鎖定」在此指**必填**（非欄位鎖住不可修改）。
- 提醒方式**不採用**擴充既有 `REQUIRE_PROFILE_COMPLETION` 強制轉導／Banner 機制，而是新增一個獨立的**首頁彈出對話視窗**，只針對「已經完成第一次填寫」（`realName`／`phone` 皆已填）但性別仍是 `unspecified` 的既有會員；「還沒完成第一次填寫」的會員維持現況（既有的 `realName`／`phone` 資料完整度守衛與 Onboarding Wizard 皆不變動，性別本來就在這批必填欄位內）。

## What Changes

- **首頁性別補填對話視窗**（新行為）：`/user/{spiritId}` 首頁（`student-profile-page`）在使用者查閱**自己**的頁面、且 `realName` 與 `phone` 皆已填寫、但 `gender` 仍為 `unspecified` 時，SHALL 彈出對話視窗詢問性別（男／女）。
  - 視窗提供「稍後再說」／關閉方式，使用者可略過；只要 `gender` 仍是 `unspecified`，下次進首頁會再次彈出。
  - 送出後呼叫新的輕量 Server Action 更新 `gender`，成功後視窗關閉、頁面刷新（之後不再彈出）。
  - 不影響「還沒完成第一次填寫」（`realName` 或 `phone` 缺漏）的會員：這批會員仍走既有 `(user)` layout 強制轉導 / Banner 機制導向個人資料頁，性別必填規則已透過個人資料頁表單本身即涵蓋（見下一點），**不新增**任何 `REQUIRE_PROFILE_COMPLETION` 相關改動。
- **個人資料頁性別欄位改為必填**（`male`／`female`），移除下拉選單中的「未設定」選項，且送出驗證不再接受 `unspecified`（與 Onboarding Wizard Step 2 的性別規則一致）。既有仍為 `unspecified` 的帳號，欄位仍可正常操作選擇男／女後儲存，非唯讀鎖定。
- **明確不做**：
  - 不修改 `REQUIRE_PROFILE_COMPLETION` 環境變數邏輯、不修改 `(user)` layout 強制轉導判定、不修改 `ProfileBanner` 顯示條件——這三者維持現狀，僅檢查 `realName`／`phone`（`ProfileBanner` 另含 `commEmail`），不含 `gender`。
  - 不做強制阻擋式 Modal（不移除關閉按鈕）。
  - 不批次通知既有未填帳號（使用者下次登入進首頁自然會看到對話視窗）。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `student-profile-page`：新增「本人專屬 — 性別補填提示對話框」需求
- `user-profile`：個人資料頁性別欄位改為必填，移除「未設定」選項

## Impact

- `app/[locale]/(user)/user/[spiritId]/page.tsx`：查詢 `user` 時 `select` 加入 `gender`；新增條件 `isOwnPage && !!user.realName && !!user.phone && user.gender === 'unspecified'` 時渲染新的 `GenderPromptDialog` 客戶端元件。
- 新增 `components/dashboard/gender-prompt-dialog.tsx`（客戶端元件）：Radix `Dialog`（`components/ui/dialog.tsx`），內容為男／女選擇按鈕＋送出，並提供「稍後再說」關閉方式；送出成功後呼叫 `router.refresh()`。
- `app/actions/profile.ts`：新增輕量 Server Action `updateGender(gender: 'male' | 'female')`——登入檢查、Zod 驗證（`z.enum(['male','female'])`）、`prisma.user.update` 更新 `gender`、`revalidatePath('/user/${spiritId}')`。
- `lib/schemas/profile.ts`：`updateProfileSchema` 的 `gender` 欄位由 `z.enum(['male','female','unspecified'])` 改為 `z.enum(['male','female'], { message: 'validation.genderRequired' })`（沿用 Onboarding 既有 i18n key）；新增一個小型 schema（或直接在 action 內以 `z.enum(['male','female'])` inline 驗證）供 `updateGender` 使用。
- `app/actions/profile.ts`：`updateProfile` 組資料時的 `gender: formData.get('gender') || 'unspecified'` fallback 移除（改為直接帶入，交由 schema 驗證必填）。
- `app/[locale]/(user)/profile/profile-form.tsx`、`app/[locale]/(user)/user/[spiritId]/profile/profile-form.tsx`：性別下拉選單移除 `<option value="unspecified">未設定</option>`。
- 對話視窗文案採**繁體中文硬編碼**，比照 `/user/[spiritId]/page.tsx` 該頁現況（該頁尚未 i18n 遷移，全頁皆硬編碼繁中，依 CLAUDE.md 第 12 點「既有未遷移字串維持繁體顯示」原則，不單獨為新元件引入 i18n key）。
- 無 DB migration（`Gender` enum 與預設值不變）。
- **不變更**：`lib/auth.ts`（`isProfileComplete` 計算維持 `realName && phone`，不含 `gender`）、`app/[locale]/(user)/layout.tsx`（強制轉導邏輯不變）、`components/dashboard/profile-banner.tsx`（提醒文字與觸發條件不變）。

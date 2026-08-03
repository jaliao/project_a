## Context

`User.gender` enum（`male`／`female`／`unspecified`，預設 `unspecified`）在 Onboarding Wizard Step 2（`lib/schemas/profile.ts` 的 `onboardingProfileSchema`）已強制必填 `male`／`female`，但這只保證「Onboarding 上線後、走過 Wizard」的帳號有填。以下兩種帳號仍可能停在 `unspecified`：
1. Onboarding Wizard 上線前既有帳號（`realName`／`phone` 可能早已填妥，只是當時性別非必填）。
2. 走過 Onboarding 後，於一般個人資料頁（`updateProfileSchema`，目前允許 `unspecified`）又改回未設定。

原本評估過「把 `gender` 併入既有『資料完整度』判定（`realName`＋`phone`）」的方案，會連動 `lib/auth.ts` 的 `isProfileComplete`、`(user)` layout 強制轉導、`ProfileBanner`——**使用者明確要求不要這樣做**：不想擴充 `REQUIRE_PROFILE_COMPLETION` 相關機制，而是要一個獨立、只在首頁彈出的對話視窗，且只鎖定「已經完成第一次填寫」的既有會員。

「已完成第一次填寫」在既有程式中沒有獨立欄位可判斷，但可以用 `realName && phone` 皆已填來界定——這正是既有 `isProfileComplete`（`lib/auth.ts`）／`(user)` layout 強制轉導所使用的判斷基準。因此：
- 若 `realName`／`phone` 缺漏 → 使用者本來就會被既有機制導向個人資料頁；此時該頁的性別欄位已經是必填（見下方「個人資料頁性別必填」），一次性一起填完，不需要額外機制。
- 若 `realName`／`phone` 已填、但 `gender` 仍是 `unspecified` → 這批人不會被既有守衛攔下，需要新的首頁對話視窗來補提醒。

首頁實作位於 `app/[locale]/(user)/user/[spiritId]/page.tsx`（對應 `student-profile-page` capability），`isOwnPage` 判斷（L118）已存在，`ProfileBanner` 也是在 `isOwnPage` 為真時才顯示（L134），新對話視窗可比照同一個閘門條件加掛。

## Goals / Non-Goals

**Goals:**
- 已完成首次填寫（`realName`＆`phone`皆已填）但性別仍 `unspecified` 的既有會員，造訪自己的首頁時看到對話視窗，可選擇男／女或先略過。
- 個人資料頁性別欄位改為必填（`male`／`female`），避免使用者填完又改回 `unspecified` 讓對話視窗每次都重複彈出卻又能繞過。

**Non-Goals:**
- 不修改 `REQUIRE_PROFILE_COMPLETION` 環境變數、`lib/auth.ts` 的 `isProfileComplete` 計算、`(user)` layout 強制轉導邏輯、`ProfileBanner` 觸發條件——這四者維持完全不變。
- 不做欄位鎖定／唯讀（需求提出人已確認「鎖定」= 必填，非唯讀）。
- 不做強制阻擋式 Modal（提供關閉／稍後再說）。
- 不記錄「使用者已略過幾次」或做冷卻時間；下次進首頁只要 `gender` 仍是 `unspecified` 就會再次彈出，邏輯單純（每次 render 時的即時狀態判斷，非額外的「已讀」狀態）。
- 不批次通知／不新增後台報表；不影響 Onboarding Wizard（Step 2 已經是必填，行為不變）。
- 不變更 `Gender` enum 定義或預設值，不需要 migration。
- 後台會員篩選（`components/admin/members-filter.tsx`）的「未設定」篩選選項維持不變（仍需能篩出尚未補填的既有帳號）。

## Decisions

- **新增 `components/dashboard/gender-prompt-dialog.tsx`（客戶端元件）**：以 `components/ui/dialog.tsx`（`Dialog`／`DialogContent`／`DialogHeader`／`DialogTitle`／`DialogFooter`，專案既有 UI kit，`course-detail-actions.tsx` 已有先例）實作。預設開啟（`defaultOpen`，由父層條件式渲染控制是否掛載），內容為「男」「女」兩個選擇按鈕＋送出，並提供「稍後再說」文字連結／右上角關閉圖示可直接關閉（僅關閉當前 render，不寫入任何略過紀錄）。
- **新增 Server Action `updateGender(gender: 'male' | 'female')`**（`app/actions/profile.ts`，與 `updateProfile` 相鄰）：登入檢查（`auth()`）→ Zod 驗證 `z.enum(['male', 'female'])` → `prisma.user.update({ where: { id }, data: { gender } })` → `revalidatePath('/user/${spiritId}')`（`spiritId` 取自 session）。不重用 `updateProfileSchema`／`updateProfile`，因為對話視窗只送單一欄位，硬套完整表單 schema（含 `realName`、`churchType` 等必填欄位）會不必要地複雜化。
- **渲染條件**：`app/[locale]/(user)/user/[spiritId]/page.tsx` 查詢 `user` 時 `select` 加入 `gender: true`；在既有 `isOwnPage` 區塊（緊鄰 `ProfileBanner`）新增：
  ```
  {isOwnPage && !!user.realName && !!user.phone && user.gender === 'unspecified' && (
    <GenderPromptDialog />
  )}
  ```
  不依賴 `REQUIRE_PROFILE_COMPLETION`——無論該環境變數為何值，只要條件成立就會渲染（這是與既有 Banner 機制刻意切開的獨立行為）。
- **送出後刷新**：`GenderPromptDialog` 送出成功後呼叫 `router.refresh()`（比照 `course-detail-actions.tsx` 既有 `handleReopen` 等模式），重新從 server 取得 `gender`，條件不再成立、對話視窗不再掛載，不需要額外的 client state 去「記得已經填過」。
- **一般個人資料頁性別必填**：`updateProfileSchema.gender` 改為 `z.enum(['male', 'female'], { message: 'validation.genderRequired' })`，與 `onboardingProfileSchema` 使用同一個既有 i18n key（`validation.genderRequired` 已存在於 `messages/*.json`，不需新增）。
  - 兩個 `profile-form.tsx`（`/profile` 與 `/user/[spiritId]/profile`）的性別 `<select>` 移除 `<option value="unspecified">未設定</option>`，只留男／女兩個選項。
  - `app/actions/profile.ts` 的 `formData.get('gender') || 'unspecified'` fallback 移除；表單一定會送出 `male`／`female` 其中之一。
- **文案語言**：對話視窗文字採繁體中文硬編碼，不新增 i18n key——`/user/[spiritId]/page.tsx` 全頁（含即將修改的區塊）目前皆為硬編碼繁中，尚未走過 next-intl 遷移；依 CLAUDE.md 第 12 點「既有未遷移字串維持繁體顯示」的漸進遷移原則，不在同一支未遷移頁面裡混用 i18n key 與硬編碼，避免半調子遷移。
- **不動的部分**：`lib/auth.ts`／`(user)/layout.tsx`／`ProfileBanner`／`components/admin/members-filter.tsx` 的 `GENDER_OPTIONS`／`app/api/admin/members/export/route.ts`／`lib/data/dashboard.ts` 性別統計圖表——這些是既有機制或「顯示既有資料」用途，`unspecified` 在歷史資料清空前仍會存在，不應該連帶修改。

## Risks / Trade-offs

- [風險] 對話視窗每次進首頁都可能重新彈出（無冷卻時間），已略過的使用者可能感到干擾 → Mitigation：需求提出人明確要求「可關閉略過，下次再跳出」而非做已讀記錄，本次照需求實作最簡單版本；若日後覺得太干擾，可在後續 CR 加冷卻時間或「不再提醒」。
- [風險] 個人資料頁性別必填後，若使用者本來就沒有明確性別認同想留白 → Mitigation：需求單本身即要求「必填」，且與 Onboarding 既有規則一致（Onboarding 早已強制男／女二選一），非本次改變既有產品決策。
- [風險] `updateGender` 與 `updateProfile` 是兩個獨立寫入 `gender` 的路徑，未來若 `updateProfileSchema` 邏輯調整（例如新增性別相關的連動驗證）需記得兩處同步 → Mitigation：`updateGender` 刻意保持極簡（單欄位、無連動邏輯），目前無同步風險；於 `updateGender` 註解註明與 `updateProfile` 的分工。

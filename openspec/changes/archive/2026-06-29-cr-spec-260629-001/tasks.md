## 1. 資料模型

- [x] 1.1 `prisma/schema/user.prisma` 新增 `birthYear Int?`（西元年、可空）並加繁中註解
- [x] 1.2 `make schema-update name=add_user_birth_year` 建立 migration 並產生 client（`20260629013149_add_user_birth_year`）

## 2. 驗證 Schema

- [x] 2.1 `lib/schemas/profile.ts`：`updateProfileSchema` 新增 `birthYear`（可空、整數、範圍 1900~當年）
- [x] 2.2 新增 `onboardingProfileSchema`（realName、phone、gender∈{male,female}、birthYear 範圍、church：church 含 churchId／other 含 churchOther、拒 none）

## 3. Onboarding 流程

- [x] 3.1 `app/onboarding/onboarding-wizard.tsx` Step2Profile：新增性別、出生年、所屬教會欄位（沿用教會清單），改用 react-hook-form + zodResolver，套用必填驗證與錯誤顯示
- [x] 3.2 `app/onboarding/page.tsx`：載入 `getActivechurches` 傳入 Wizard；放行條件維持 `realName && phone` 不變
- [x] 3.3 `app/actions/auth.ts` `completeOnboardingProfile`：以 `onboardingProfileSchema` 驗證 gender／birthYear／churchType／churchId／churchOther，原子寫入 `User`

## 4. 個人資料維護

- [x] 4.1 `app/(user)/user/[spiritId]/profile/profile-form.tsx`：新增「出生年」欄位（預填、可清空）— 此為活躍表單
- [x] 4.2 `app/(user)/profile/profile-form.tsx` 為死碼（page 僅 redirect、無人引用）；僅同步修正型別以通過 build，不新增功能欄位
- [x] 4.3 `app/actions/profile.ts`：讀取並儲存 `birthYear`（透過 `updateProfileSchema`）

## 5. 驗證

- [x] 5.1 新會員 onboarding：三欄位必填（gender 預設空值/教會預設空值/birthYear 超範圍皆由 `onboardingProfileSchema` 擋下），正確值寫入 `User`（由 schema + action 邏輯保證）
- [x] 5.2 既有會員放行條件（`app/onboarding/page.tsx`）維持 `!isTempPassword && realName && phone`，不被導回 onboarding
- [x] 5.3 個人資料頁出生年欄位可新增/修改/清空（空值→null），透過 `updateProfile` 儲存
- [x] 5.4 `npm run lint`（0 errors）與 `npm run build`（✓ Compiled successfully）通過

## 6. 文件與版本

- [x] 6.1 更新 `doc/學員手冊.md`：首次登入 Step 2 三必填欄位、完善個人資料新增出生年
- [x] 6.2 檢查老師/管理者手冊：出生年未納入其 detail/匯出視圖、onboarding「補填」判定未變，無需改動
- [x] 6.3 `doc/學員手冊.md` 版本 v0.1.94；`config/version.json` 0.1.97 → 0.1.98
- [x] 6.4 `README-AI.md`：版本 0.1.98、資料模型新增 `birthYear`、當前任務新增本變更

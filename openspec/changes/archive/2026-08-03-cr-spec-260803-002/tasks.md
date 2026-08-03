## 1. 首頁性別補填對話視窗

- [x] 1.1 `app/actions/profile.ts`：新增 `updateGender(gender: 'male' | 'female')` Server Action——`auth()` 登入檢查、`z.enum(['male', 'female'])` 驗證、`prisma.user.update({ where: { id }, data: { gender } })`、`revalidatePath('/user/${session.user.spiritId?.toLowerCase()}')`
- [x] 1.2 新增 `components/dashboard/gender-prompt-dialog.tsx`（client component）：`Dialog`／`DialogContent`／`DialogHeader`／`DialogTitle`／`DialogFooter`（`components/ui/dialog.tsx`），內容「男」／「女」選擇按鈕＋送出按鈕，並提供「稍後再說」關閉方式；送出呼叫 `updateGender`，成功後 `router.refresh()` 並關閉；失敗顯示 toast 錯誤
- [x] 1.3 `app/[locale]/(user)/user/[spiritId]/page.tsx`：`user` 查詢 `select` 加入 `gender: true`；在 `isOwnPage` 區塊（緊鄰 `ProfileBanner`）新增條件渲染 `{isOwnPage && !!user.realName && !!user.phone && user.gender === 'unspecified' && <GenderPromptDialog />}`

## 2. 個人資料頁性別必填

- [x] 2.1 `lib/schemas/profile.ts`：`updateProfileSchema.gender` 由 `z.enum(['male', 'female', 'unspecified'])` 改為 `z.enum(['male', 'female'], { message: 'validation.genderRequired' })`（`validation.genderRequired` 已存在於三語 messages，無需新增 key）
- [x] 2.2 `app/actions/profile.ts`：`updateProfile` 移除 `gender: formData.get('gender') || 'unspecified'` 的 fallback，改為 `gender: formData.get('gender')`
- [x] 2.3 `app/[locale]/(user)/profile/profile-form.tsx`：性別 `<select>` 移除 `<option value="unspecified">未設定</option>`
- [x] 2.4 `app/[locale]/(user)/user/[spiritId]/profile/profile-form.tsx`：性別 `<select>` 移除 `<option value="unspecified">未設定</option>`

## 3. 驗證

- [x] 3.1 `npx tsc --noEmit`、`npm run lint` 通過
- [x] 3.2 準備一個 `realName`／`phone` 已填、`gender=unspecified` 的測試帳號（`make prisma-studio` 手動改值），登入後造訪自己的首頁 `/user/{spiritId}`，確認彈出性別補填對話視窗
- [x] 3.3 對話視窗選「男」或「女」送出，確認關閉、`User.gender` 已更新；重新整理首頁確認不再彈出
- [x] 3.4 對話視窗點「稍後再說」關閉，重新整理首頁確認再次彈出（因 `gender` 仍為 `unspecified`）
- [x] 3.5 造訪他人首頁（非本人）確認不彈出對話視窗；`realName` 或 `phone` 缺漏的帳號確認不彈出（走既有守衛/Banner 流程）
- [x] 3.6 個人資料頁確認性別下拉選單僅剩「男」／「女」兩個選項，未選擇即送出顯示必填錯誤
- [x] 3.7 確認 `REQUIRE_PROFILE_COMPLETION`（`true`／`false`／未設定）三種情況下，`(user)` layout 強制轉導與 `ProfileBanner` 行為皆與本次改動前一致（未受性別欄位影響）

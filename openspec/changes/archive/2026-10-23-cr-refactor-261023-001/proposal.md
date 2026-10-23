## Why

上一輪變更（CR-FEAT-261023-xxx 系列之外、未另開單的小改動）為了讓「代填（未註冊）學員」狀態出現在 `/user/[spiritId]` 個人首頁的「身分標籤」區塊，臨時新增了一個獨立元件 `components/shared/unregistered-student-badge.tsx`（固定琥珀色警示樣式：`border-amber-300 bg-amber-50 text-amber-800`），掛在既有 `getIdentityTags()`（`lib/utils/identity-tags.ts`，只處理 `roles`）的渲染迴圈**之外**；同時把後台 `/admin/members` 列表、`/admin/members/[id]` 詳情頁頁首、`duplicate-candidate-row.tsx`、`student-picker.tsx` 裡原本各自手刻的「未註冊」Badge/span，全部換成這個新元件、文字統一為「未註冊學員」。

使用者實測比對畫面後，發現兩個問題：

1. **視覺不一致**：`/user/PA261977` 的「身分標籤」區塊裡，「未註冊學員」是唯一一個琥珀色警示樣式的標籤，其餘身分標籤（系統管理員、書籍講師）都是中性灰的 `variant="secondary"`，格格不入，是臨時加上去的「特別設計」。
2. **資料不一致**：後台 `/admin/members/[id]`（如 `.../28073119-bd70-4c08-8530-0c5a6b543559`）與 `/admin/members?q=justin.home` 列表的「身分」欄位／欄目，其實是完全另一套邏輯（直接 `(member.roles as UserRole[]).map` + `ROLE_LABELS`），壓根沒有把 `isProxyMember` 算進「身分」裡——「未註冊學員」徽章是顯示在姓名旁邊的獨立位置，不屬於「身分」欄位本身。使用者在「身分」欄位只看到「一般會員」，看不到這個帳號其實是未註冊代填學員。

使用者明確要求：**取消**這個臨時、獨立於其他身分標籤的琥珀色特別設計，改成「身分標籤」（角色 roles ＋ 是否為未註冊代填學員）全部收斂成**單一商業邏輯函式 + 單一渲染元件**，讓所有顯示身分標籤的地方（個人首頁、後台會員列表、後台會員詳情頁、疑似重複帳號比對卡片、選擇學員元件）都呼叫同一套邏輯、用同一個元件渲染，樣式與資料來源一致，不再各自手刻 Badge。

## What Changes

- **擴充 `lib/utils/identity-tags.ts` 的 `getIdentityTags()`**：新增 `isProxyMember: boolean` 參數（置於 `roles` 之後），回傳的標籤陣列新增「未註冊學員」（`isProxyMember` 為真時，陣列最前）與「一般會員」基準標籤（`roles` 有實際資料且不含其他身分標籤時，置於陣列最後——對齊後台現行「身分」欄位恆顯示 `user` 基線身分的既有行為）。文字樣式一律套用同一種中性 Badge 樣式，不再有專屬警示色。
- **新增單一渲染元件** `components/shared/identity-tag-badges.tsx`（`IdentityTagBadges`），取代目前散落 5 處（`/user/[spiritId]`、`/admin/members` 列表、`/admin/members/[id]` 詳情頁、`duplicate-candidate-row.tsx`、`student-picker.tsx`）各自手刻的 Badge/span 渲染邏輯。
- **刪除** `components/shared/unregistered-student-badge.tsx`（臨時特別設計的元件，功能併入 `getIdentityTags()` + `IdentityTagBadges`）。
- **後台 `/admin/members` 列表、`/admin/members/[id]` 詳情頁**：移除姓名旁獨立的「未註冊學員」Badge，改為併入既有「身分」欄位／欄目，呼叫同一個 `getIdentityTags()` + `IdentityTagBadges` 呈現（含 roles 推導的身分標籤與未註冊學員標籤）。
- **`duplicate-candidate-row.tsx`、`student-picker.tsx`**：改呼叫同一個 `getIdentityTags()`（僅傳 `isProxyMember`，`roles` 傳 `undefined`／不提供）+ `IdentityTagBadges`，標籤文字與樣式與其他頁面一致，但不額外顯示角色身分（這兩處原本就不帶角色資料，維持原有資訊量）。
- **`/user/[spiritId]` 個人首頁**：「身分標籤」區塊改呼叫擴充後的 `getIdentityTags(roles, isProxyMember, tRole)`；因標籤陣列恆非空（至少含「一般會員」基準標籤），移除「—」佔位符分支。

## Impact

- Affected specs: `identity-tags`（ADDED/MODIFIED/REMOVED）、`admin-member-management`（MODIFIED：身分欄位、代填學員標示）、`admin-duplicate-account-detection`（MODIFIED：未註冊徽章文字與呈現方式）、`student-picker`（MODIFIED：未註冊徽章文字與呈現方式）
- Affected code:
  - `lib/utils/identity-tags.ts`（擴充 `getIdentityTags()`）
  - `components/shared/identity-tag-badges.tsx`（新增）
  - `components/shared/unregistered-student-badge.tsx`（刪除）
  - `app/[locale]/(user)/user/[spiritId]/page.tsx`
  - `app/[locale]/(admin)/admin/members/page.tsx`
  - `app/[locale]/(admin)/admin/members/[id]/page.tsx`
  - `components/admin/duplicate-candidate-row.tsx`
  - `components/shared/student-picker.tsx`
- 純前端顯示邏輯重構，不涉及資料庫 schema 變更、不影響既有「身分」篩選／搜尋／授權判定邏輯。

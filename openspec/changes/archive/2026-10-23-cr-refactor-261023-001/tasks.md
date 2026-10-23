## 1. 商業邏輯：擴充 `getIdentityTags()`

- [x] 1.1 `lib/utils/identity-tags.ts`：新增 `isProxyMember: boolean` 參數；回傳陣列新增「未註冊學員」（`isProxyMember` 為真時置於最前）與「一般會員」基準標籤（僅當 `roles` 參數非 `undefined`／`null` 時置於最後）
- [x] 1.2 更新檔案頭註解，說明新參數與基準標籤規則
- [x] 1.3 `messages/zh-TW.json`／`messages/en.json` 的 `role.unregisteredStudent`、`role.user` key 沿用既有內容，確認不需新增（`unregisteredStudent` 已存在；`user` 已存在於 `ROLE_LABELS`／`role` namespace）
- [x] 1.4（實作時新增）`isProxyMember` 加上預設值 `false`：發現既有呼叫端 `components/admin/member-tag.tsx`（`MemberTag`，未在本次 CR 影響範圍內的另一個身分標籤顯示元件）只傳 `roles` 一個參數，為維持其既有行為並避免型別錯誤，改為選填參數

## 2. 新增單一渲染元件，刪除特別設計元件

- [x] 2.1 新增 `components/shared/identity-tag-badges.tsx`（`IdentityTagBadges`），以 `variant="secondary" className="text-xs"` 渲染傳入的 `tags: string[]`，空陣列時回傳 `null`
- [x] 2.2 刪除 `components/shared/unregistered-student-badge.tsx`

## 3. `/user/[spiritId]` 個人首頁

- [x] 3.1 身分標籤區塊改用 `getIdentityTags(user.roles, user.isProxyMember, tRole)` + `<IdentityTagBadges tags={identityTags} />`
- [x] 3.2 移除「—」佔位符分支（標籤陣列恆非空）
- [x] 3.3 移除對 `unregistered-student-badge` 的 import

## 4. 後台 `/admin/members` 列表

- [x] 4.1 移除姓名旁獨立的未註冊學員 Badge
- [x] 4.2 「身分」欄改用 `getIdentityTags(member.roles, member.isProxyMember)` + `<IdentityTagBadges />`，取代原本 `(member.roles as UserRole[]).map` + `ROLE_LABELS` 的手刻渲染
- [x] 4.3 若 `ROLE_LABELS`／`UserRole` import 已無其他用途，移除該 import（`ROLE_LABELS` 已移除，`UserRole` 仍供篩選用保留）

## 5. 後台 `/admin/members/[id]` 詳情頁

- [x] 5.1 移除頁首姓名旁獨立的未註冊學員 Badge
- [x] 5.2 基本資料分頁「身分」欄位改用 `getIdentityTags(member.roles, member.isProxyMember)` + `<IdentityTagBadges />`
- [x] 5.3 若 `ROLE_LABELS` import 已無其他用途，移除該 import（`Badge` 因「已暫停」徽章仍在使用，保留）

## 6. `duplicate-candidate-row.tsx`

- [x] 6.1 `CandidateSideCard` 改用 `getIdentityTags(undefined, side.isProxyMember)` + `<IdentityTagBadges />`，取代原本手刻的琥珀色 Badge

## 7. `student-picker.tsx`

- [x] 7.1 `PickerRow` 改用 `getIdentityTags(undefined, item.isProxyMember)` + `<IdentityTagBadges />`，取代原本的 `span` pill 樣式

## 8. 驗證

- [x] 8.1 `npm run lint` 無新增錯誤（12 個既有警告，與本次異動無關，0 錯誤）
- [x] 8.2 `npx tsc --noEmit` 無型別錯誤
- [x] 8.2a（實作時新增）`npm run build` production build 成功，涵蓋所有異動頁面（`/admin/members`、`/admin/members/[id]`、`/user/[spiritId]` 等）
- [ ] 8.3 手動核對 5 個頁面/元件的身分標籤顯示（需人工於瀏覽器操作，本次 session 未執行，待人工驗收）：
  - `/user/[spiritId]`（一般會員／未註冊代填學員／講師／管理者各驗證一次）
  - `/admin/members` 列表
  - `/admin/members/[id]` 詳情頁
  - `/admin/members/duplicates`（疑似重複帳號，含代填學員一側）
  - 任一班級的「選擇學員」`StudentPicker` 彈窗（含代填學員候選人）
- [ ] 8.4 確認所有身分標籤樣式一致（`variant="secondary"`），無殘留琥珀色警示樣式（需配合 8.3 人工驗收一併確認）

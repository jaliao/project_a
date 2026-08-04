## 1. `MemberTagInfo` 型別遷移

- [x] 1.1 `MemberTagInfo` 型別定義由 `lib/data/course-order.ts` 搬移至 `components/admin/member-tag.tsx`（`export type`）
- [x] 1.2 `lib/data/course-order.ts` 改為 `import type { MemberTagInfo } from '@/components/admin/member-tag'`，移除原本的型別定義（其餘用法不變）

## 2. Data Layer 調整（lib/data/certificate.ts）

- [x] 2.1 `getCertificateProductionList` 的 `InviteEnrollment` 查詢，`invite` select 新增 `createdBy`（完整會員標籤所需欄位：`id`／`spiritId`／`roles`／`nickname`／`realName`／`englishName`／`displayNameMode`／`avatarKey`／`image`）
- [x] 2.2 `CertificateListItem` 新增 `teacher: MemberTagInfo`（非 nullable）；`eligible`／`rows` 組裝過程一併帶出（`displayName` 用 `getMemberDisplayName()`、`avatarUrl` 用 `resolveAvatarUrl()`）

## 3. 證書製作頁調整（app/[locale]/(admin)/admin/certificates/page.tsx）

- [x] 3.1 匯入 `MemberTag`，卡片新增「教師」標籤與 `<MemberTag {...it.teacher} />`，置於既有身分資訊區塊（啟動編號/顯示名稱/單位/階層結業日）之後、製作狀態備註區塊之前

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit`、`npm run lint` 通過（0 errors；16 個既有警告與本次改動無關）
- [x] 4.2 已用 Playwright 對真實開發環境實測：admin 帳號登入，開啟 `/admin/certificates`，30 張卡片皆正確顯示「教師」會員標籤區塊（啟動編號、身分標籤、頭像、顯示名稱），截圖確認版面正確
- [x] 4.3 點擊卡片教師標籤的「檢視」連結，確認 `href` 正確指向 `/admin/members/{id}`（新分頁開啟）
- [x] 4.4 點擊「訊息」，確認訊息 Drawer 成功開啟
- [x] 4.5 切換 `?status=done` 篩選頁面正常渲染；搜尋輸入框存在；既有功能（分頁、標記完成/還原、備註）未因本次改動報錯
- [x] 4.6 教材申請頁（`/admin/materials`）展開含講師的訂單，會員標籤仍正常顯示，確認 `MemberTagInfo` 搬移後無回歸問題

**驗證備註**：測試過程中出現的 Radix `useId` hydration 警告，經另外對 `/admin/certificates` 做完全乾淨的重新整理（無並行檔案編輯）重測，0 個 console 錯誤，確認該警告是測試腳本執行期間原始碼仍在被編輯所觸發的 Fast Refresh 假訊號，非本次改動引入的真實問題；`tbody` 的 key prop 警告與先前 CR-260804-001 驗證時已確認的既有問題相同，非本次改動範圍。

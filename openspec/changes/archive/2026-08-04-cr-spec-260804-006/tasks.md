## 1. Data Layer 調整（lib/data/certificate.ts）

- [x] 1.1 `enrollments` 查詢的 `invite` select 新增 `createdBy`（欄位比照 `course-order.ts` 的 `instructor`：`id`/`spiritId`/`roles`/`realName`/`name`/`email`/`nickname`/`englishName`/`displayNameMode`/`avatarKey`/`image`/`gender`/`church: { select: { name: true } }`/`churchOther`）
- [x] 1.2 `Eligible` 型別新增 `teacher: MemberTagInfo`，於組裝 `eligible` Map 時一併帶入（隨既有去重邏輯，取最新結業日對應的講師快照）
- [x] 1.3 `CertificateListItem` 型別新增 `teacher: MemberTagInfo`；`rows` 組裝補上 `teacher`，邏輯比照 `course-order.ts` 的 `instructor`（`displayName: getMemberDisplayName(...)`、`realName ?? null`、`gender`、`churchLabel: church?.name ?? churchOther ?? null`、`avatarUrl: resolveAvatarUrl(...)`）

## 2. UI 調整（certificates/page.tsx）

- [x] 2.1 移除卡片中「顯示名稱：」該行 `<p>`（`CertificateListItem.displayName` 型別欄位保留，僅移除此行渲染）
- [x] 2.2 於「學員：」列下方新增「老師：」列：`<MemberTextTag {...it.teacher} />`

## 3. 驗證

- [x] 3.1 `npx tsc --noEmit`、`npm run lint` 通過
- [x] 3.2 開發環境登入 admin 帳號，開啟 `/admin/certificates`，確認卡片「學員」列下方為「老師」列（會員文字元件呈現），不再有獨立「顯示名稱：」列—— Playwright 結構化驗證：body 含「老師：」不含「顯示名稱：」，卡片內兩個底線觸發元件
- [x] 3.3 點擊「老師」列文字，確認彈出的會員標籤內容為該學員所屬課程邀請建立者（講師），非學員本人；「檢視」「訊息」按鈕功能正常—— 老師 popover 顯示 Gordon（PA260001），檢視連結指向其會員 id（與學員 popover 之 id 不同）；過程中發現並修正 `withRealName`（`lib/utils/member-display.ts`）既有 bug：`displayNameMode=nickname_zh` 時 `displayName` 已內嵌 `realName`（如「Gordon（黃國倫）」），舊版用 `===` 比對導致重複附註為「Gordon（黃國倫）（黃國倫）」，改用 `displayName.includes(realName)` 判斷後修正
- [x] 3.4 隨機抽查數張卡片，確認老師資訊與該學員實際所屬課程（`courseInvite.createdBy`）一致—— DB 查詢比對前 5 筆已結業報名之 `invite.createdBy`，與頁面顯示（PA260100 羅詠韶 → PA260001 Gordon 黃國倫）一致

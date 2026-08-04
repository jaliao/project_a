## 1. 新增元件：會員文字元件（components/admin/member-text-tag.tsx）

- [x] 1.1 建立 `MemberTextTag` 元件，props 為 `MemberTagInfo`：`Popover` + `PopoverTrigger`（`<button type="button">`，樣式 `underline underline-offset-2`，文字為 `{spiritId} {displayName}`）
- [x] 1.2 `PopoverContent` 移除預設邊框/內距/陰影/背景（`border-none bg-transparent p-0 shadow-none w-auto`），內部渲染既有 `<MemberTag {...info} />`（避免雙層邊框）

## 2. 證書製作資料層調整（lib/data/certificate.ts）

- [x] 2.1 移除 `cr-spec-260804-002` 新增的 `invite.createdBy` select 擴充
- [x] 2.2 `CertificateListItem` 移除 `teacher: MemberTagInfo`，新增 `member: MemberTagInfo`（該學員自身）
- [x] 2.3 `enrollments` 查詢的 `user` select 新增 `roles`／`avatarKey`／`image`（組出 `member` 所需欄位）
- [x] 2.4 `Eligible` 型別與組裝邏輯同步調整：移除 `teacher` 相關程式碼（含 `const teacher = e.invite.createdBy`），新增 `EligibleUser` 型別（`DisplayUser & { roles, avatarKey, image }`），`member` 於最終 `rows.map` 組裝（`displayName` 沿用既有 `getMemberDisplayName()` 結果、`avatarUrl` 用 `resolveAvatarUrl()`）

## 3. 證書製作頁調整（app/[locale]/(admin)/admin/certificates/page.tsx）

- [x] 3.1 匯入 `MemberTextTag`，移除 import `MemberTag`（此頁不再直接使用）
- [x] 3.2 移除卡片的「教師」會員標籤區塊（`cr-spec-260804-002` 新增的部分）
- [x] 3.3 「啟動編號」列的標籤文字改為「學員」，值改為 `<MemberTextTag {...it.member} />`（取代原本純文字 `it.spiritId`）

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit`、`npm run lint` 通過（0 errors；16 個既有警告與本次改動無關）
- [x] 4.2 已用 Playwright 對真實開發環境實測：admin 帳號登入，開啟 `/admin/certificates`，「教師」標籤 0 筆（已移除），30 張卡片皆顯示「學員：」底線文字（格式如 `PA260100 羅詠韶`，與票單範例一致）
- [x] 4.3 點擊「學員」列文字，Popover 正確彈出完整會員標籤（截圖確認無雙層邊框，卡片緊貼在觸發文字下方）
- [x] 4.4 Popover 內「檢視」連結 `href` 正確指向 `/admin/members/{id}`；點擊「訊息」成功開啟訊息 Drawer
- [x] 4.5 切換 `?status=done` 篩選頁面正常渲染，既有功能未因本次改動報錯
- [x] 4.6 教材申請頁（`/admin/materials`）展開含講師的訂單，完整卡片版本的會員標籤（含「講師」標籤文字）仍正常顯示，確認未受本次改動影響

**驗證備註**：測試中出現的 hydration 警告與 `tbody` key prop 警告，與前兩次（CR-260804-001／002）驗證時已確認的既有問題／Fast Refresh 假訊號相同，非本次改動範圍。

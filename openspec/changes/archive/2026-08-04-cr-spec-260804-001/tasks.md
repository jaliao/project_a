## 1. 共用邏輯抽出

- [x] 1.1 新增 `lib/utils/identity-tags.ts`：`getIdentityTags(roles: Roles): string[]`（系統管理員優先，各書籍講師身分依 `TEACHER_ROLES` 逐一附加，邏輯移植自 `user/[spiritId]/page.tsx` 既有內嵌計算）。`Roles` 型別原本未從 `lib/auth-roles.ts` 匯出，順手補上 `export`
- [x] 1.2 `app/[locale]/(user)/user/[spiritId]/page.tsx` 既有內嵌的身分標籤計算改呼叫 `getIdentityTags`，移除重複邏輯（純重構，畫面行為不變）；同步移除不再使用的 `TEACHER_ROLES`／`ROLE_LABELS` import

## 2. Data Layer 調整（lib/data/course-order.ts）

- [x] 2.1 `getAllCourseOrdersWithInvite` 的 `courseInvite.createdBy` select 擴充：新增 `id`／`spiritId`／`roles`／`nickname`／`realName`／`englishName`／`displayNameMode`／`avatarKey`／`image`
- [x] 2.2 新增匯出型別 `MemberTagInfo = { id: string; spiritId: string | null; roles: string[]; displayName: string; avatarUrl: string | null }`，放在 `lib/data/course-order.ts`（與 `CourseOrderWithInvite` 同檔案，供 `member-tag.tsx` import）
- [x] 2.3 `CourseOrderWithInvite` 新增 `instructor: MemberTagInfo | null`；`getAllCourseOrdersWithInvite` 的 mapped 結果組出該欄位（`displayName` 用 `getMemberDisplayName()`、`avatarUrl` 用 `resolveAvatarUrl()`，`createdBy` 不存在時為 `null`）；既有 `instructorName`／`instructorEmail` 欄位維持不變

## 3. 新增元件：會員標籤（components/admin/member-tag.tsx）

- [x] 3.1 建立 `MemberTag` 元件，props 為 `MemberTagInfo`：第一列顯示啟動編號＋身分標籤（`getIdentityTags`，`Badge` 呈現，無標籤時「—」）；第二列顯示頭像（`UserAvatar`）＋顯示名稱
- [x] 3.2 「檢視」按鈕：`Link href={`/admin/members/${id}`} target="_blank" rel="noopener noreferrer"`，圖示 `IconExternalLink`
- [x] 3.3 「訊息」按鈕：呼叫 `useMessageDrawer().openMessageDrawer(id)`，圖示 `IconMessage`（純圖示，無文字 label）

## 4. 教材申請列表調整（components/admin/material-order-table.tsx）

- [x] 4.1 移除「講師」欄位的 Email 顯示（`order.instructorEmail` 該段整段移除），僅保留 `order.instructorName`
- [x] 4.2 新增分頁籤：`Tabs`／`TabsList`／`TabsTrigger`（`components/ui/tabs.tsx`），三個值 `all`／`pending`／`completed`，`useState` 管理，預設 `all`
- [x] 4.3 依分頁籤篩選 `orders`：`completed` 為 `getMaterialOrderStatusKey(order)` 屬於 `shipped`／`received`；`pending` 為不屬於上述兩者；`all` 不過濾。額外處理：篩選後為空時列表顯示「此分類目前無教材申請」提示列（而非整段隱藏，讓分頁籤本身維持可見可切換）
- [x] 4.4 `OrderDetail` 新增會員標籤區塊：`order.instructor` 有值時渲染 `<MemberTag {...order.instructor} />`；為 `null` 時不渲染該區塊

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit`、`npm run lint` 通過（0 errors；16 個既有警告與本次改動無關）
- [x] 5.2 已用 Playwright 對真實開發環境實測：admin 帳號登入，開啟 `/admin/materials`，預設「全部」分頁籤顯示所有 4 筆申請（含新建的測試獨立訂單）
- [x] 5.3 切換「待處理」分頁籤，確認僅顯示待批價狀態的測試獨立訂單、不含已收件訂單；切換「已完成」分頁籤，確認僅顯示 3 筆已收件訂單、不含待批價訂單
- [x] 5.4 確認列表「講師」欄位不再顯示 Email（整份表格內容不含 `@` 字元）
- [x] 5.5 展開一筆有關聯課程的申請（#5，講師為測試講師 PA269999），會員標籤正確顯示啟動編號、3 個講師身分標籤、頭像、顯示名稱；「檢視」連結指向 `/admin/members/{id}`；點擊「訊息」成功開啟訊息 Drawer
- [x] 5.6 展開測試獨立訂單（#9，無關聯課程），截圖確認未顯示會員標籤區塊，直接顯示「購買人資料」
- [x] 5.7 `user/[spiritId]` 頁面實測：身分標籤（3 個講師標籤）正常顯示，無 console 錯誤，重構前後行為一致

**驗證環境備註**：本機開發容器（`project_a-web-1`／`project_a-db-1`）於測試前已是先前 session 停止的狀態，用 `docker start` 啟動既有容器（非 `make dev` 的前台＋tunnel 模式）；為涵蓋「待處理」與「無關聯講師」情境，於開發資料庫手動新增一筆測試獨立訂單（`course_orders.id = 9`，`buyerNameZh = '測試獨立訂單'`）。過程中發現一則與本次改動無關的既有警告（`tbody` 內 `.map()` 回傳的 Fragment 未加 `key`），經 `git diff` 確認為本次未觸碰的既有程式碼，不在本次修復範圍。

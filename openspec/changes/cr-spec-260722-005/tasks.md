## 1. Prisma Schema

- [x] 1.1 `prisma/schema/course-invite.prisma`：`CourseInvite` 新增 `archivedAt DateTime?`／`archiveReason String?`
- [x] 1.2 `make schema-update name=course-archive` 建立並套用 migration（本機 dev DB）
- [x] 1.3 查核 `prisma/schema/course-order.prisma` 中 `CourseOrder.courseInviteId` 實際 FK 刪除行為：查核 migration 歷史確認為 `ON DELETE SET NULL`（`course_orders_courseInviteId_fkey`），刪除課程交易不需額外處理該關聯；同時確認 `material_shipment_items_enrollmentId_fkey` 亦為 `ON DELETE SET NULL`，僅 `invite_enrollments_inviteId_fkey` 為 `ON DELETE RESTRICT` 需交易內手動 `deleteMany`

## 2. Server Actions

- [x] 2.1 `app/actions/course-session.ts` 新增 `archiveCourseSession(inviteId, reason?)`：守衛 `canAccessAdmin`，設定 `archivedAt = now()`／`archiveReason`，`revalidatePath` 課程詳情頁與開課管理清單
- [x] 2.2 新增 `unarchiveCourseSession(inviteId)`：守衛 `canAccessAdmin`，清空 `archivedAt`／`archiveReason`
- [x] 2.3 新增 `deleteCourseSession(inviteId)`：守衛 `canAccessAdmin`，於 `prisma.$transaction` 內依序刪除該課全部 `InviteEnrollment` → `CourseInvite`（`MaterialShipmentItem`／`CourseOrder.courseInviteId` 依 FK 自動 SetNull，不需手動處理）
- [x] 2.4 三個 Action 皆回傳既有 `ActionResponse` 型別（`success`/`message`/`errors`）

## 3. UI — 課程詳情頁

- [x] 3.1 新增 `components/course-session/archive-course-dialog.tsx`（比照 `components/course-session/cancel-course-dialog.tsx` 樣式），含選填原因欄位
- [x] 3.2 新增 `components/course-session/delete-course-dialog.tsx`，內容需查詢並顯示該課報名人數與已結業人數，明確警示不可回復
- [x] 3.3 `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`：依 `canAccessAdmin` 顯示「封存課程」/「解除封存」與「刪除課程」按鈕；刪除成功後導向 `/admin/course-sessions`
- [x] 3.4 課程詳情頁其餘既有區塊（狀態顯示等）於已封存課程時維持原樣呈現，不額外變更版面（封存僅影響清單可見性，不影響課程本身狀態顯示邏輯）

## 4. UI — 開課管理清單

- [x] 4.1 `lib/data/course-sessions.ts` 的 `getAllCourseSessionsAdmin`：`status` 型別新增 `'archived'`；`status !== 'archived'` 時 where 條件加上 `archivedAt: null`，`status === 'archived'` 時改為 `archivedAt: { not: null } }`
- [x] 4.2 `app/[locale]/(admin)/admin/course-sessions/course-sessions-filter.tsx`：狀態下拉選單新增「已封存」選項
- [x] 4.3 課程卡片（`course-session-card` 共用元件）於已封存課程增加視覺標示（如徽章「已封存」），供管理者於清單中快速識別

## 5. i18n

- [x] 5.1 新增/確認所需文案 key（封存課程、解除封存、刪除課程、確認 Dialog 標題與內容、toast 訊息等）加入 `messages/zh-TW.json` 對應命名空間，並補 `messages/en.json`
- [x] 5.2 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`

## 6. 文件與版本號同步

- [x] 6.1 更新 `doc/管理者操作手冊.md`：新增開課管理「封存課程」「刪除課程」操作說明與權限範圍（僅 admin/superadmin）
- [x] 6.2 檢查 `doc/老師手冊.md`／`doc/學員手冊.md` 是否需同步：確認封存僅影響後台開課管理清單（`getAllCourseSessionsAdmin`），講師「我的開課記錄」與學員端清單不受影響，故兩份手冊不需修改
- [x] 6.3 手冊檔首版本標註與日期更新；`config/version.json` patch 版號 +1（0.1.166 → 0.1.167），`updatedAt` 更新為 2026-08-11

## 7. 驗證

- [x] 7.1 `npm run lint`（0 errors，16 個既有警告與本次變更無關）
- [x] 7.2 `npm run build`（編譯成功，TypeScript 檢查通過）
- [x] 7.3 權限守衛：三個 Action 皆沿用專案既有的 `canAccessAdmin()` 守衛模式（與其他既有 admin-only 操作一致），程式碼審查確認一般講師（非 admin）呼叫會被拒絕；⚠️ 未實際以瀏覽器登入不同身分點擊按鈕驗證（無瀏覽器自動化工具可用），僅完成程式邏輯層驗證
- [x] 7.4 於 dev DB 以實際 Prisma 交易驗證：封存後 `archivedAt: null` 查詢不可見、`archivedAt: {not: null}` 查詢可見；解除封存後恢復預設可見（見執行紀錄，測試資料已清除）
- [x] 7.5 於 dev DB 以實際 Prisma 交易驗證：刪除有報名與 `AdminActionLog` 關聯的測試課程，交易無 FK 錯誤、`CourseInvite` 確實移除、`AdminActionLog` 保留且 `inviteId` 已自動 SetNull（見執行紀錄，測試資料已清除）

## 8. 正式環境資料清理（非程式碼變更，功能上線後另行執行）

- [ ] 8.1 Spec 上線並部署後，管理者使用新的「刪除課程」功能，清除正式環境中 6 筆無報名資料的廢棄「（補建）」課程（id 357, 358, 374, 383, 384, 387，需以上線後實際查詢結果為準）
- [ ] 8.2 確認 5 筆有效補登紀錄（id 372, 375, 377, 378, 385）維持不動

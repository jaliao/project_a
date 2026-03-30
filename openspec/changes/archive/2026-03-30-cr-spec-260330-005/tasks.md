## 1. Schema 與資料庫

- [x] 1.1 在 `prisma/schema/course-order.prisma` 的 `CourseOrder` model 新增 `shippedAt DateTime?` 與 `receivedAt DateTime?` 欄位
- [x] 1.2 執行 `make schema-update name=add_material_order_status` 產生 migration 並更新 Prisma Client

## 2. Server Actions

- [x] 2.1 在 `app/actions/course-order.ts` 新增 `applyMaterialOrder(inviteId, data)` Action（建立或更新 CourseOrder 並關聯 CourseInvite，已寄送後禁止修改）
- [x] 2.2 在 `app/actions/course-order.ts` 新增 `confirmShipment(orderId)` Action（管理者設定 shippedAt，需驗證 admin role）
- [x] 2.3 在 `app/actions/course-order.ts` 新增 `confirmReceipt(inviteId)` Action（講師設定 receivedAt，需驗證 shippedAt 存在）

## 3. Data Access Layer

- [x] 3.1 在 `lib/data/` 新增 `getCourseOrderByInviteId(inviteId)` 查詢（含 shippedAt、receivedAt 欄位）
- [x] 3.2 在 `lib/data/` 新增 `getAllCourseOrdersWithInvite()` 查詢（後台列表用，含關聯 CourseInvite.title、createdBy 姓名）

## 4. Zod Schema

- [x] 4.1 在 `lib/schemas/` 新增或更新 `courseOrderSchema`，加入教材申請表單的 Zod 驗證（沿用 CourseOrder 欄位定義）

## 5. 前台：教材申請表單元件

- [x] 5.1 建立 `components/course-session/material-order-dialog.tsx`（Dialog + 表單，含所有 CourseOrder 欄位）
- [x] 5.2 實作表單預填邏輯：優先帶入現有 CourseOrder 資料，次則 CourseInvite.courseDate + User profile
- [x] 5.3 已寄送（shippedAt != null）時表單欄位設為唯讀，隱藏送出按鈕

## 6. 前台：課程詳情頁整合

- [x] 6.1 更新 `app/(user)/course/[id]/page.tsx` 的資料查詢，一併取得關聯 CourseOrder（含 shippedAt、receivedAt）
- [x] 6.2 更新 `app/(user)/course/[id]/course-detail-actions.tsx`，加入「申請教材」/ 「查看教材申請」按鈕（依 courseOrderId 判斷顯示哪個）
- [x] 6.3 在 `course-detail-actions.tsx` 加入教材寄送狀態提示文字（「教材申請中，等待管理者寄送」/ 「教材已寄出，請確認收件後開始上課」）
- [x] 6.4 在 `course-detail-actions.tsx` 加入「我已收到教材」按鈕（shippedAt != null && receivedAt == null 時顯示），點擊呼叫 confirmReceipt
- [x] 6.5 修改「開始上課」按鈕顯示條件：加入 `courseOrder?.receivedAt != null` 前置判斷，無 CourseOrder 時顯示「請先申請教材」提示

## 7. 後台：教材申請管理頁

- [x] 7.1 建立 `app/(user)/admin/materials/page.tsx`（Server Component，呼叫 getAllCourseOrdersWithInvite，驗證 admin role）
- [x] 7.2 建立 `components/admin/material-order-table.tsx`（列表元件，顯示申請編號、課程名稱、講師、教材版本、數量、申請時間、狀態標籤）
- [x] 7.3 實作狀態標籤元件（待寄送/已寄送/已收件，對應顏色）
- [x] 7.4 在表格列新增「確認已寄送」按鈕（shippedAt == null 時顯示），點擊呼叫 confirmShipment 並刷新
- [x] 7.5 實作詳情展開：點擊列後顯示 CourseOrder 完整欄位（購買性質、取貨方式、電話、Email 等）

## 8. 版本與文件

- [x] 8.1 更新 `config/version.json` patch 版本號 +1
- [x] 8.2 依 `.ai-rules.md` 規範更新 `README-AI.md`

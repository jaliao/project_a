## 1. Schema 與 Migration

- [x] 1.1 `prisma/schema/course-order.prisma`：`CourseOrder` 新增 `traditionalQty Int @default(0)`、`simplifiedQty Int @default(0)`
- [x] 1.2 `make schema-update name=add_course_order_book_qty` 建立 migration；於 migration 內回填既有**多地址**訂單（由 `material_shipments` 各版本加總），單一地址歷史訂單維持 0

## 2. 驗證 Schema

- [x] 2.1 `lib/schemas/course-order.ts`：`materialOrderSchema` 新增 `traditionalQty`/`simplifiedQty`（多地址用各 shipment 既有欄位；單一地址改由 server 自動帶入，表單不需輸入）

## 3. 資料層（進度與數量）

- [x] 3.1 `lib/data/course-sessions.ts`：`CourseSessionOrder` 型別與 `getCourseSessionById` select 新增 `traditionalQty`/`simplifiedQty`
- [x] 3.2 課程詳情衍生進度：總需求（`getEnrollmentMaterialSummary`）、已申請（orders 繁/簡加總）、尚未申請（`max(0, 總−已)`，繁/簡各算）；於 `page.tsx` 或資料層計算後傳給 UI
- [x] 3.3 `lib/data/course-order.ts`：`CourseOrderWithInvite`、`CourseOrderForPrint` 型別與 select 新增 `traditionalQty`/`simplifiedQty`

## 4. Server Action（自動帶剩餘＋上限）

- [x] 4.1 `app/actions/course-order.ts` `applyMaterialOrder`：以當下 DB 重算「尚未申請」剩餘量
- [x] 4.2 單一地址：自動以剩餘繁/簡寫入 `traditionalQty`/`simplifiedQty`（不需前端輸入）
- [x] 4.3 多地址：以各 shipment 繁/簡加總作為訂單 `traditionalQty`/`simplifiedQty`，並驗證批次加總一致
- [x] 4.4 共同上限驗證：繁/簡數量不得超過剩餘量（超額拒絕）；單筆至少 1 本；剩餘為 0 時拒絕

## 5. UI（前台三區塊）

- [x] 5.1 `app/(user)/course/[id]/course-detail-actions.tsx`：重整為三區塊（教材申請／開始上課／取消上課），每塊「標題→說明→動作」
- [x] 5.2 教材申請區：說明顯示 總需求／已申請／尚未申請（繁簡分列）；訂單清單每筆顯示「繁 X、簡 Y」＋狀態＋動作；「申請教材」按鈕僅在尚未申請>0 可按
- [x] 5.3 開始上課區：說明含注意事項與 `startReasons`；動作為「開始上課」（沿用 `canStart`）
- [x] 5.4 取消上課區：僅「取消授課」按鈕
- [x] 5.5 `app/(user)/course/[id]/page.tsx`：傳入進度數據與剩餘量
- [x] 5.6 `components/course-session/material-order-dialog.tsx`：單一地址以唯讀顯示「本次將申請：繁 X、簡 Y」；多地址顯示剩餘量並限制分配上限

## 6. UI（後台呈現）

- [x] 6.1 `components/admin/material-order-table.tsx`：列表/展開詳情顯示該筆訂單繁/簡本數
- [x] 6.2 `app/(user)/admin/materials/[id]/print/page.tsx`：出貨單顯示該筆訂單繁/簡本數

## 7. 驗證

- [x] 7.1 `npm run build` 通過
- [x] 7.2 手動驗證：單一地址自動帶剩餘、寫入正確；多地址分配加總一致；不可超額
- [x] 7.3 手動驗證：進度（總／已／未）正確；尚未申請=0 時申請按鈕停用；學員增加後恢復
- [x] 7.4 手動驗證：前台訂單清單與後台列表/出貨單皆顯示繁/簡數量

## 8. 文件與版本（CLAUDE.md 第 7/9 點）

- [x] 8.1 同步 `doc/老師手冊.md`（三區塊操作、申請進度與數量）、`doc/管理者操作手冊.md`（後台顯示繁/簡數量），更新檔首版本與日期
- [x] 8.2 `config/version.json` patch 版本號 +1
- [x] 8.3 更新 `README-AI.md`（CourseOrder 繁/簡數量、申請進度邏輯）

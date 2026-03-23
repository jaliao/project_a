## 1. 資料庫模型

- [x] 1.1 新增 `prisma/schema/course-order.prisma`，定義 `MaterialVersion`、`PurchaseType`、`DeliveryMethod` enum 與 `CourseOrder` 模型
- [x] 1.2 執行 `make schema-update name=add_course_order` 產生 migration 並更新 Prisma client

## 2. Zod Schema 與 Server Action

- [x] 2.1 新增 `lib/schemas/course-order.ts`，定義 Zod schema（含條件驗證：代購時 `studentNames` 必填、選「其他」時 `quantityNote` 必填）
- [x] 2.2 新增 `app/actions/course-order.ts`，實作 `createCourseOrder` Server Action（驗證 session → Zod validate → prisma.create → return ActionResponse with id）

## 3. 表單元件

- [x] 3.1 新增 `components/course-order/course-order-form.tsx`，實作 React Hook Form + zodResolver
- [x] 3.2 實作教材版本 RadioGroup（繁體版 / 簡體版 / 繁體＋簡體）
- [x] 3.3 實作購買性質 RadioGroup（種子教師自用 / 自用＋代購 / 只幫學員代購），選含代購時條件顯示學員姓名 Textarea
- [x] 3.4 實作購買數量 RadioGroup（1–8 本固定選項 + 其他），選「其他」時條件顯示自填數量 Input
- [x] 3.5 實作取貨方式 RadioGroup（7-11 / 全家 / 郵寄宅配）
- [x] 3.6 實作預計開課日期 Input（文字，placeholder「例：2026-05-01 或 無」）
- [x] 3.7 實作統一編號 Input（選填）
- [x] 3.8 接入 `createCourseOrder` Server Action，成功後顯示 toast（「訂單已送出（編號 #N）」）並呼叫 `onSuccess` callback
- [x] 3.9 新增 `components/course-order/course-order-dialog.tsx`，包裝 Dialog 殼，props: `open`、`onOpenChange`

## 4. Topbar 接入

- [x] 4.1 修改 `components/layout/topbar.tsx`，加入 `isOrderOpen` state，將「新增課程」按鈕 onClick 改為 `setIsOrderOpen(true)`，渲染 `<CourseOrderDialog>`

## 5. 版本與文件

- [x] 5.1 更新 `config/version.json` patch 版本號 +1
- [x] 5.2 更新 `README-AI.md`（新增 CourseOrder 模型至資料模型章節，更新當前任務狀態）

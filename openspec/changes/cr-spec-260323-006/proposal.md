## Why

Topbar 的「新增課程」按鈕目前為預留佔位，缺乏實際的課程教材訂購表單。需要建立完整的訂購流程，讓教師能夠填寫購買人資料、選擇教材版本與數量、並指定取貨方式。

## What Changes

- 新增課程訂購表單 Dialog（從 Topbar「新增課程」按鈕觸發）
- 表單含 13 個欄位（含條件顯示欄位）：
  - 購買人中文姓名、英文姓名、教師姓名、所屬教會/單位、Email、聯絡電話
  - 教材版本（繁體版 / 簡體版 / 繁體+簡體）
  - 購買性質（種子教師自用 / 自用＋代購 / 純代購）
  - 幫學員代購姓名（條件顯示：選擇代購時必填）
  - 總購買數量（1–8 本固定選項或自填）
  - 預計開課日期
  - 統一編號（選填）
  - 取貨方式（7-11 / 全家 / 郵寄宅配）
- 表單驗證（必填欄位、Email 格式、電話格式）
- 提交後將訂單儲存至資料庫，並顯示成功提示

## Capabilities

### New Capabilities
- `course-order`: 課程教材訂購表單，含 Dialog 入口、表單欄位定義、Zod 驗證、Server Action、資料模型（CourseOrder）

### Modified Capabilities
- `topbar`: 將「新增課程」按鈕的 onClick 從佔位改為開啟 CourseOrderDialog

## Impact

- `prisma/schema/project.prisma` — 新增 `CourseOrder` 模型
- `app/actions/course-order.ts` — 新增 Server Action（createCourseOrder）
- `lib/schemas/course-order.ts` — Zod 驗證 schema
- `components/course-order/course-order-dialog.tsx` — Dialog 入口元件
- `components/course-order/course-order-form.tsx` — 表單主體
- `components/layout/topbar.tsx` — 接入 CourseOrderDialog
- DB schema 變更，需執行 `make schema-update`

## Why

出貨單（print page）目前缺少書本名稱，管理者無法從出貨單得知本次寄送的是哪本書，需補上此欄位。書本名稱即課程目錄（`CourseCatalog.label`），透過 `CourseInvite.courseCatalog` 關聯取得。

## What Changes

- `getCourseOrderForPrint` 查詢時，透過 `courseInvites.courseCatalog.label` 取得書本名稱
- `CourseOrderForPrint` 型別新增 `catalogLabel: string | null`
- 出貨單列印頁（`app/(user)/admin/materials/[id]/print/page.tsx`）在課程資訊區塊新增「書本名稱」一列

## Capabilities

### New Capabilities
（無新 capability，屬於既有出貨單功能的資料補充）

### Modified Capabilities
- `material-order-application`：出貨單顯示需求新增書本名稱欄位

## Impact

- `lib/data/course-order.ts`：`getCourseOrderForPrint` select 補上 `courseCatalog.label`，型別更新
- `app/(user)/admin/materials/[id]/print/page.tsx`：UI 補上「書本名稱」列

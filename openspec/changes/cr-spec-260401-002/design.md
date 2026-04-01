## Context

出貨單列印頁目前只顯示課程名稱（`CourseInvite.title`，講師自訂）。書本名稱則是課程目錄的正式名稱（`CourseCatalog.label`），需另外透過 join 取得。

資料路徑：`CourseOrder` → `CourseInvite` → `CourseCatalog.label`

## Goals / Non-Goals

**Goals:**
- 出貨單列印頁顯示書本名稱（`CourseCatalog.label`）
- 修改最小，僅動 data layer 查詢與 print page UI

**Non-Goals:**
- 修改 CourseOrder 或 CourseInvite 資料結構
- 其他頁面（管理列表、申請表單）不受影響

## Decisions

**直接在 getCourseOrderForPrint 的 courseInvites 子查詢中 join courseCatalog.label**
- 無需額外 query，一次取完
- 型別加 `catalogLabel: string | null`（若 invite 無關聯則為 null）

## Risks / Trade-offs

- [Risk] CourseInvite 沒有關聯 CourseCatalog（理論上不應發生） → 顯示「（未填）」fallback

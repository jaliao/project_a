## 1. 資料層修正

- [x] 1.1 在 `lib/data/course-order.ts` 的 `getCourseOrderForPrint` 子查詢 `courseInvites` 內，補上 `courseCatalog: { select: { label: true } }`
- [x] 1.2 更新 `CourseOrderForPrint` 型別定義，新增 `catalogLabel: string | null`
- [x] 1.3 更新 `getCourseOrderForPrint` 回傳物件，補上 `catalogLabel: invite?.courseCatalog?.label ?? null`

## 2. 出貨單列印頁 UI 修正

- [x] 2.1 在 `app/(user)/admin/materials/[id]/print/page.tsx` 的「課程資訊」區塊，補上「書本名稱」列，顯示 `order.catalogLabel || '（未填）'`

## 3. 版本與文件更新

- [x] 3.1 將 `config/version.json` patch 版本號 +1
- [x] 3.2 更新 `README-AI.md` 版本號

## Why

目前教材版本僅支援「繁體／簡體」中文教材（`MaterialChoice`: none / traditional / simplified），但部分課程學員需要英文版教材。目前系統無法讓學員申請英文教材、老師/管理者無法申請英文書籍出貨、後台與出貨單也無法統計與呈現英文本數，僅能靠備註手動處理，缺乏正式的申請、統計、出貨支援。

## What Changes

- `MaterialChoice` enum 新增 `english` 選項（連同既有 `none` / `traditional` / `simplified`）。
- 學員報名「選擇書籍」Dialog 由三選一（無須購買／繁體／簡體）擴充為四選一，新增「英文教材」選項。
- 書本項目版本（逐本項目、指派、快照）比照現有繁/簡機制擴充支援英文（`MaterialShipmentItem.version` 快照新增 `'english'`），送出申請時可將任一本調整為英文版。
- `CourseOrder` / `MaterialShipment` 新增 `englishQty` 欄位，與 `traditionalQty` / `simplifiedQty` 並列，本數皆由實際送出/指派之書本項目推導。
- 教材需求統計、教材申請進度（總需求／已申請／尚未申請）、後台教材管理列表與詳情、出貨單列印，皆同步新增英文本數與英文書本清單的顯示（原「繁 X / 簡 Y」擴充為「繁 X / 簡 Y / 英 Z」）。
- i18n 文案新增英文版本相關 key（`messages/zh-TW.json` 為主，同步補 `messages/en.json`，`zh-CN` 以 `npm run gen:zh-cn` 重新產生，不手改）。

## Capabilities

### New Capabilities

（無新增能力；本次為既有「書籍版本」機制擴充第三種版本，不引入新領域概念）

### Modified Capabilities

- `course-enrollment-application`: 學員「選擇書籍」Dialog 由三選項擴充為四選項（新增英文教材），`InviteEnrollment.materialChoice` 允許值新增 `english`。
- `material-book-items`: 書本項目（逐本項目、地址指派、單一地址涵蓋、版本覆寫）之「版本」概念由繁/簡兩態擴充為繁/簡/英三態。
- `course-multi-material-order`: 教材需求統計、教材申請進度、訂單清單之繁/簡本數顯示與推導，擴充為繁/簡/英三種本數。
- `material-order-application`: 前台教材申請訂單內嵌顯示之書本數量由「繁 X / 簡 Y」擴充為含英文本數。
- `admin-material-management`: 後台教材管理列表、詳情、地址別書本清單，擴充顯示英文本數與英文書本項目。
- `print-shipping-order`: 出貨單列印之本數統計與書本清單，擴充顯示英文本數與英文書本項目。
- `material-multi-address-shipping`: 寄送批次（`MaterialShipment`）記錄新增 `englishQty`，各地址本數推導邏輯同步擴充。

## Impact

- **Schema**：`prisma/schema/course-invite.prisma`（`MaterialChoice` enum）、`prisma/schema/course-order.prisma`（`CourseOrder.englishQty` / `MaterialShipment.englishQty`），需 `make schema-update` 產生 migration。既有資料相容（新 enum 值、新欄位皆為新增，`@default(0)`）。
- **Zod schemas**：`lib/schemas/course-order.ts`（僅 `orderBookItemInputSchema.version` 新增 `'english'`；頂層 `courseOrderSchema.materialVersion`／`MaterialVersion` enum 屬獨立、目前無任何頁面掛載的「課程訂購」舊表單 `CourseOrderDialog`/`CourseOrderForm`/`createCourseOrder`，不在本次範圍）。
- **Data layer**：`lib/data/material-items.ts`、`lib/data/course-order.ts`（`applyMaterialOrder` 一路）、`lib/data/course-sessions.ts`、`lib/utils/material-progress.ts`（`MaterialCount` 型別與加總邏輯）、`lib/utils/course-start-gate.ts`。
- **Server Actions**：`app/actions/course-invite.ts`、`app/actions/course-order.ts`（僅 `applyMaterialOrder`）、`app/actions/test-course-session.ts`。
- **UI**：`components/course-session/enrollment-application-dialog.tsx`（學員選書 Dialog）、`components/course-session/material-order-dialog.tsx`、`components/admin/material-order-table.tsx`、`app/[locale]/(user)/course/[id]/approved-students-section.tsx`、`app/[locale]/(user)/course/[id]/course-detail-actions.tsx`、`app/[locale]/(user)/course/[id]/page.tsx`、`app/[locale]/(admin)/admin/materials/[id]/print/page.tsx`。
- **i18n**：`messages/zh-TW.json`（`course.material.*`、`course.enroll.*` 命名空間新增英文版本 key）、`messages/en.json` 同步補譯、`messages/zh-CN.json` 以 `npm run gen:zh-cn` 重新產生。
- **文件**：依 CLAUDE.md 第 9 點，功能異動須同步檢查 `doc/管理者操作手冊.md`、`doc/老師手冊.md`、`doc/學員手冊.md`；並依第 7 點將 `config/version.json` patch +1。

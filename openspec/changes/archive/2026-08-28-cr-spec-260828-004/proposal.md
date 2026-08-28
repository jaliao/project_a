## Why

需求單 CR-SPEC-260828-004（提出人：廖柏嘉 Justin，2026-08-28）：

> 課程 FAQ 廢除
> - 把課程 FAQ 的相關程式移除
> - 資料庫的資料表可以保留

課程 FAQ（`/course/[id]` 詳情頁底部的「課程 FAQ」1 對 1 留言問答區塊，2026-06-11 由 cr-spec-260611-002 導入）實務上被當成學員／講師與管理者之間的零星課務溝通管道，與「聯繫管理者」「站內訊息」功能重疊，維護成本大於價值，決定整組下架。

正式站 `course_messages` 現有約 86 筆歷史留言（截至 2026-08-28）。**保留資料表與歷史資料**，僅移除應用層程式，日後如需查閱仍可直接查資料庫。

## What Changes

### 1. 移除課程 FAQ 應用層程式

- **刪除**元件 `components/course-faq/course-faq.tsx`（整個 `components/course-faq/` 目錄）。
- **刪除** server actions `app/actions/course-message.ts`（`postCourseQuestion` / `replyCourseMessage` / `deleteCourseMessage`）。
- **刪除** data layer `lib/data/course-message.ts`（`getCourseMessages`、`CourseMessageThread` 型別）。
- **刪除** zod schema `lib/schemas/course-message.ts`（`courseMessageSchema`）。
- `app/[locale]/(user)/course/[id]/page.tsx`：移除 `getCourseMessages`／`CourseFaq` 的 import、`faqMessages` 查詢、以及頁面底部 `<CourseFaq>` 區塊。

### 2. 移除 i18n 文案

- `messages/zh-TW.json`、`messages/en.json`：刪除 `course.faq` 命名空間整段（`title`／`askPlaceholder`／`submitAsk`／…／`confirmDelete` 共 21 個 key）。
- `messages/zh-CN.json`：由 `npm run gen:zh-cn` 重新產生（移除對應段落）。

### 3. 保留資料庫

- **不動** `prisma/schema/course-message.prisma` 的 `CourseMessage` model 與 `User.courseMessages`／`CourseInvite.messages` 關聯；**不建立 migration**。`course_messages` 資料表與現有資料原樣保留。
- `deleteCourseSession`（`app/actions/course-session.ts`）依 `CourseMessage` 的 `onDelete: Cascade` 隨課程刪除留言之行為維持不變。

### 4. 文件同步（CLAUDE.md #9）

- `doc/學員手冊.md`：移除「七、課程 FAQ（留言提問）」整節，其後章節與目錄／錨點連結順移（8→7 … 15→14）。
- `doc/老師手冊.md`：移除「十一、課程 FAQ（回覆學員提問）」整節，其後章節與目錄順移（12→11、13→12）；「十二、課程詳情頁說明」如列有 FAQ 相關敘述一併移除。
- `doc/管理者操作手冊.md`：確認無課程 FAQ 相關敘述（現況 grep 無命中），如有則一併移除。
- 三份手冊檔首版本標註與日期更新；`config/version.json` patch 版號 +1、`updatedAt` 更新為套用當日（CLAUDE.md #7）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `course-faq`：整個能力退場——移除全部 4 條 Requirement（課程 FAQ 留言區塊〔含 1 對 1 可見性規則〕、會員提問、授課老師回覆、刪除留言）。封存本變更並同步 delta 後，`openspec/specs/course-faq/` 隨之清空。
- `i18n-course`：「課程元件在地化」Requirement 移除對已刪除之 `components/course-faq` 的引用。

## Impact

- **Affected code**
  - 刪除：`components/course-faq/course-faq.tsx`、`app/actions/course-message.ts`、`lib/data/course-message.ts`、`lib/schemas/course-message.ts`
  - 修改：`app/[locale]/(user)/course/[id]/page.tsx`（移除 FAQ import／查詢／render）
  - 修改：`messages/zh-TW.json`、`messages/en.json`（移除 `course.faq`）；`messages/zh-CN.json`（重新產生）
- **Database**：無 schema 變更、無 migration；`course_messages` 表與資料保留，`CourseMessage` Prisma model 與關聯欄位保留。
- **i18n**（CLAUDE.md #12）：僅刪除 key；`zh-CN` 重新產生。
- **Docs**（CLAUDE.md #9）：三份操作手冊移除課程 FAQ 章節並順移編號；檔首版本／日期更新。
- **Version**（CLAUDE.md #7）：apply 時 `config/version.json` patch +1、`updatedAt` 更新為當日。
- **Dependencies**：無新增或移除套件。
- **相容性**：純移除，無資料遷移；正式站部署後課程詳情頁不再顯示 FAQ 區塊，既有 `course_messages` 資料不受影響。

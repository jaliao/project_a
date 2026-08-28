## 1. 移除頁面引用

- [x] 1.1 `app/[locale]/(user)/course/[id]/page.tsx`：移除 `import { getCourseMessages } from '@/lib/data/course-message'` 與 `import { CourseFaq } from '@/components/course-faq/course-faq'`
- [x] 1.2 同檔：移除 `faqMessages` 查詢區塊（`const faqMessages = await getCourseMessages(...)` 及其上方註解）
- [x] 1.3 同檔：移除頁面底部 `{/* 課程 FAQ 留言問答 */}` 與 `<CourseFaq ... />` render 區塊

## 2. 刪除課程 FAQ 程式檔

- [x] 2.1 刪除 `components/course-faq/course-faq.tsx`（及空目錄 `components/course-faq/`）
- [x] 2.2 刪除 `app/actions/course-message.ts`
- [x] 2.3 刪除 `lib/data/course-message.ts`
- [x] 2.4 刪除 `lib/schemas/course-message.ts`
- [x] 2.5 全庫 grep 確認 `course-message`／`CourseFaq`／`getCourseMessages`／`postCourseQuestion`／`replyCourseMessage`／`deleteCourseMessage`／`courseMessageSchema`／`CourseMessageThread` 在 `app`／`components`／`lib`／`hooks` 已無殘留引用

## 3. 保留資料庫（不建 migration）

- [x] 3.1 `prisma/schema/course-message.prisma`：`CourseMessage` model 與 `User.courseMessages`／`CourseInvite.messages` 關聯**維持不動**；於 model 上方註解標示「課程 FAQ 功能已於 CR-SPEC-260828-004 下架，model 與資料表僅為保留歷史資料」
- [x] 3.2 確認 `app/actions/course-session.ts` 的 `deleteCourseSession` 不需修改（`CourseMessage` cascade 行為與註解仍正確）
- [x] 3.3 不執行 `make schema-update`／不產生 migration；`npx prisma validate` 通過即可

## 4. i18n 文案移除

- [x] 4.1 `messages/zh-TW.json`：刪除 `course.faq` 命名空間整段（`title`…`confirmDelete`），並處理前一個 sibling key 的結尾逗號使 JSON 合法
- [x] 4.2 `messages/en.json`：同步刪除 `course.faq` 整段
- [x] 4.3 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`，確認 `course.faq` 段已消失
- [x] 4.4 三檔以 `node -e "require('./messages/zh-TW.json')"` 之類方式或 `npm run build` 確認 JSON 合法

## 5. 操作手冊同步（CLAUDE.md #9）

- [x] 5.1 `doc/學員手冊.md`：刪除「## 七、課程 FAQ（留言提問）」整節；第八～十五節標題中文數字順移為七～十四
- [x] 5.2 `doc/學員手冊.md`：更新「## 目錄」清單——刪除第 7 項，其餘項目編號與錨點連結（`#八上課與教材` → `#七上課與教材` 等）順移
- [x] 5.3 `doc/老師手冊.md`：刪除「## 十一、課程 FAQ（回覆學員提問）」整節；第十二～十三節順移為十一～十二
- [x] 5.4 `doc/老師手冊.md`：更新「## 目錄」清單編號與錨點；檢查「課程詳情頁說明」一節是否列有課程 FAQ 相關敘述，如有一併移除
- [x] 5.5 `doc/管理者操作手冊.md`：grep「FAQ」「課程留言」皆無命中，無課程 FAQ 相關敘述，不需更動內容
- [x] 5.6 有異動的兩份手冊（學員、老師）檔首版本標註改為 v0.1.173（2026-08-28）；管理者手冊未異動故不動（CLAUDE.md #9「修正手冊後」）

## 6. 版本號（CLAUDE.md #7）

- [x] 6.1 `config/version.json`：patch 版號 +1，`updatedAt` 更新為套用當日（YYYY-MM-DD）

## 7. 驗證

- [x] 7.1 `npm run lint`（無新增 error）
- [x] 7.2 `npm run build`（編譯成功、TypeScript 檢查通過、`prebuild` 的 `gen:zh-cn` 正常）
- [x] 7.3 程式層驗證：已移除 `<CourseFaq>` render 與 import，`/[locale]/course/[id]` route `npm run build` 編譯成功；未實際以瀏覽器登入雙視角點擊驗證（無瀏覽器自動化工具）
- [x] 7.4 `npx prisma validate` 通過；`git status` 確認 `prisma/migrations/` 無新增檔
- [x] 7.5 未做 schema／migration 變更，`course_messages` 資料表與資料本質上不受影響；本機 project_a dev DB 容器目前未啟動，未執行即時筆數查詢（正式站資料為需求重點，本變更不觸及資料）

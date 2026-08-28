# 設計說明

本變更為單純的功能下架，無新增邏輯。以下記錄兩個影響做法的決策。

## 決策 1：保留 Prisma model 與關聯，只刪應用層程式

需求明言「資料庫的資料表可以保留」。可行做法有二：

| 做法 | 內容 | 取捨 |
|---|---|---|
| **A（採用）** | 保留 `CourseMessage` model、`User.courseMessages`、`CourseInvite.messages` 關聯完全不動，不建 migration；僅刪除 component／action／data／schema／i18n 與頁面引用 | 零 migration 風險；`deleteCourseSession` 的 cascade 行為不變；歷史資料可直接查 DB；schema 保留一段「已無程式使用」的 model |
| B（不採用） | 一併從 schema 移除 model 與關聯欄位，靠 `prisma db pull`／`@@ignore` 或手動 migration 保留實體資料表 | 需處理 relation 欄位移除、migration drift 與 `prisma generate` 影響面；違反「低風險」原則，且對「保留資料表」無實質好處 |

採 A。`prisma/schema/course-message.prisma` 檔案保留，可加一行註解標示「課程 FAQ 功能已於 CR-SPEC-260828-004 下架，資料表與 model 僅為保留歷史資料」。

## 決策 2：`app/actions/course-session.ts` 的 cascade 註解與行為

`deleteCourseSession` 內註解「CourseMessage 依 onDelete: Cascade 自動隨課程刪除」。因 model 與 FK 皆保留，此行為與註解**維持正確**，本變更不需修改該檔。

## 決策 3：手冊章節順移

學員手冊移除第七節後，第八～十五節順移為七～十四；老師手冊移除第十一節後，第十二～十三節順移為十一～十二。需同步更新：

- 檔首「## 目錄」清單的編號與 Markdown 錨點連結（`#七課程-faq留言提問` 等錨點整條刪除，其餘錨點文字含中文數字，須隨標題改名一併更新）。
- 內文各節標題的中文數字。
- 檔首版本標註與日期。

管理者手冊 grep 無「FAQ」命中，預期不需更動；apply 時再次確認。

## 非目標

- 不刪除 `course_messages` 資料表、不清空資料。
- 不調整「聯繫管理者」「站內訊息」「通知中心」等其他溝通功能。
- 不提供歷史 FAQ 資料的匯出或前台唯讀檢視（如日後有需求另開變更）。

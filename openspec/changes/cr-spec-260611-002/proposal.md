## Why

課程詳情頁目前沒有任何互動問答管道，學員若對課程有疑問只能私下聯繫講師，資訊無法沉澱、其他學員也看不到。提供課程 FAQ（留言問答）可讓會員在課程頁公開提問、由授課老師回覆，形成可重複參考的問答紀錄。

## What Changes

- 新增 **課程 FAQ（留言問答）** 區塊於課程詳情頁 `/course/[id]`。
- **任何登入會員**皆可在課程頁張貼**提問**（top-level 留言）。
- **僅該課程的授課老師（開課者本人）**可**回覆**提問；學員與其他人不可回覆。
- FAQ 內容對所有可瀏覽該課程頁的登入會員**公開可見**（提問與回覆依時間排列，回覆掛在對應提問下）。
- **雙向通知**（沿用 Inbox 機制）：
  - 會員新提問 → 通知授課老師。
  - 老師回覆 → 通知該提問的發問者。
- **刪除留言**：
  - **發問者可刪除自己的留言**（提問或回覆）。
  - **授課老師可刪除該課程內任意留言**。
  - 刪除提問（top-level）時一併刪除其下回覆（cascade）。刪除不發送通知。
- 新增 `CourseMessage` 資料模型（提問與回覆同表，以 `parentId` 自關聯區分）。**需 migration**。

## Capabilities

### New Capabilities
- `course-faq`：課程詳情頁的留言問答能力——會員提問、授課老師回覆、公開顯示、雙向通知。

### Modified Capabilities
<!-- 無既有能力需求變更 -->

## Impact

- **DB schema（變更）**：新增 `prisma/schema/course-message.prisma` 之 `CourseMessage` model（`id`、`inviteId`、`authorId`、`body`、`parentId?` 自關聯、`createdAt`）；`CourseInvite`、`User` 補反向關聯。需 `make schema-update`（migration 例如 `add_course_message`）。
- **資料層** `lib/data/course-message.ts`：`getCourseMessages(inviteId)` 取得提問＋回覆（含作者顯示名稱），以提問時間排序、回覆內嵌。
- **Server Actions** `app/actions/course-message.ts`：
  - `postCourseQuestion(inviteId, body)`：任何登入會員；建立 `parentId=null` 留言；通知授課老師。
  - `replyCourseMessage(parentId, body)`：僅授課老師（`invite.createdById === session.user.id`）；建立回覆；通知提問者。
  - `deleteCourseMessage(messageId)`：允許作者本人或該課程授課老師；刪除提問時 cascade 刪除其回覆；不發通知。
- **Zod schema** `lib/schemas/course-message.ts`：留言內容驗證（必填、長度上限，例如 1–2000 字）。
- **元件** `components/course-faq/`（或 `app/(user)/course/[id]/` 下）：FAQ 區塊（提問表單 + 串列）、回覆表單、刪除按鈕（client；依權限顯示，AlertDialog 二次確認）。
- **頁面整合** `app/(user)/course/[id]/page.tsx`：渲染 FAQ 區塊，傳入 `isInstructor`、`currentUserId`、訊息列表。
- 依專案規範：完成後 `config/version.json` patch +1、重產 `README-AI.md`、更新 `doc/學員手冊.md`（提問）與 `doc/老師手冊.md`（回覆）相關章節。

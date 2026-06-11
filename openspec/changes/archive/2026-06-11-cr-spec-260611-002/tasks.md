## 1. 資料模型與 migration

- [x] 1.1 新增 `prisma/schema/course-message.prisma`：`CourseMessage` model（id、inviteId、authorId、body Text、parentId? 自關聯 `CourseMessageReplies`、createdAt、`@@index([inviteId])`、`@@map("course_messages")`）；`invite` 關聯 `onDelete: Cascade`、`parent` 關聯 `onDelete: Cascade`
- [x] 1.2 `prisma/schema/course-invite.prisma` 之 `CourseInvite` 加 `messages CourseMessage[]`
- [x] 1.3 `prisma/schema/user.prisma` 之 `User` 加 `courseMessages CourseMessage[]`
- [x] 1.4 執行 `make schema-update name=add_course_message`（產生 migration + 重生 client）

## 2. 驗證 schema 與資料層

- [x] 2.1 新增 `lib/schemas/course-message.ts`：Zod `body` 必填、trim 後 1–2000 字
- [x] 2.2 新增 `lib/data/course-message.ts`：`getCourseMessages(inviteId)` 取提問＋回覆（含 author 供 `getMemberDisplayName`），提問升序、回覆升序內嵌

## 3. Server Actions（app/actions/course-message.ts）

- [x] 3.1 `postCourseQuestion(inviteId, body)`：`auth()`（任何登入會員）；Zod 驗證；建立 `parentId=null`；查 `invite.createdById` → `createNotification` 通知老師（作者即老師則略過）；`revalidatePath('/course/${inviteId}')`
- [x] 3.2 `replyCourseMessage(parentId, body)`：取 parent 與其 `invite.createdById`，僅授課老師可回（否則回無權限）；建立回覆；`createNotification` 通知 parent.authorId（作者即老師則略過）；revalidate
- [x] 3.3 `deleteCourseMessage(messageId)`：取 message（authorId、invite.createdById）；允許作者或授課老師；刪除（cascade 回覆）；不發通知；revalidate

## 4. UI 元件與頁面整合

- [x] 4.1 新增 FAQ 區塊元件（提問表單 + 提問串列 + 回覆串列），所有會員可見提問表單
- [x] 4.2 回覆表單僅授課老師可見；刪除按鈕依權限（作者或老師）顯示，AlertDialog 二次確認；成功後 toast + `router.refresh()`
- [x] 4.3 `app/(user)/course/[id]/page.tsx` 整合：呼叫 `getCourseMessages`，渲染 FAQ 區塊並傳入 `currentUserId`、`isInstructor`、messages

## 5. 驗證

- [x] 5.1 `npm run build` 通過（✓ Compiled successfully，`/course/[id]` 正常編譯）
- [ ] 5.2 手動驗證：會員提問→老師收到通知；老師回覆→發問者收到通知；非老師無回覆框；作者可刪自己留言、老師可刪任意留言（刪提問連帶刪回覆） —需在執行中的環境手動驗證

## 6. 規範同步（依 CLAUDE.md）

- [x] 6.1 `config/version.json` patch +1
- [x] 6.2 重新產生 `README-AI.md`（新增 `CourseMessage` 模型、course-message 檔案、任務日誌）
- [x] 6.3 更新 `doc/學員手冊.md`（課程頁提問與刪除自己留言）與 `doc/老師手冊.md`（回覆與刪除留言）

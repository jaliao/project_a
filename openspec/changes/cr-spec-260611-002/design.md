## Context

課程詳情頁 `app/(user)/course/[id]/page.tsx`（Server Component，`force-dynamic`）目前以 `getCourseSessionById` 取得課程，並以 `isInstructor = userSession.user.id === courseSession.createdBy.id` 判斷講師。頁面在 `(user)` 路由群組下，所有訪客皆已登入。本變更新增課程 FAQ（留言問答）能力，需新增資料模型與相關 action / 元件。

## Goals / Non-Goals

**Goals:**
- 任何登入會員可在課程頁提問；僅該課程授課老師可回覆。
- FAQ 對所有可瀏覽課程頁者公開；提問與回覆雙向 Inbox 通知。
- 發問者可刪自己留言；授課老師可刪該課程任意留言（刪提問 cascade 刪回覆）。

**Non-Goals:**
- 不支援留言編輯。
- admin/superadmin 不額外取得回覆或刪除權限（除非本身即該課程開課者）。
- 不支援多層巢狀（僅提問 + 一層回覆）。
- 不在通知中提供深連結錨點（僅文字通知）。

## Decisions

### 1. 資料模型 `CourseMessage`（提問與回覆同表）
新增 `prisma/schema/course-message.prisma`：

```prisma
model CourseMessage {
  id        Int      @id @default(autoincrement())
  inviteId  Int
  invite    CourseInvite @relation(fields: [inviteId], references: [id], onDelete: Cascade)
  authorId  String   @db.Uuid
  author    User     @relation(fields: [authorId], references: [id])
  body      String   // 留言內容（Text）
  parentId  Int?     // null = 提問；有值 = 回覆
  parent    CourseMessage?  @relation("CourseMessageReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   CourseMessage[] @relation("CourseMessageReplies")
  createdAt DateTime @default(now())

  @@index([inviteId])
  @@map("course_messages")
}
```

- `CourseInvite` 加 `messages CourseMessage[]`；`User` 加 `courseMessages CourseMessage[]`。
- `parent` 的 `onDelete: Cascade`：刪提問自動刪回覆，毋須在 action 手動處理。
- migration 名稱 `add_course_message`，以 `make schema-update` 產生。

### 2. 授權（Server Actions，`app/actions/course-message.ts`）
- `postCourseQuestion(inviteId, body)`：`auth()` 即可（任何登入會員）。建立 `parentId=null`。查 `invite.createdById` → `createNotification(teacherId, ...)`。發問者本人為老師時略過自我通知。
- `replyCourseMessage(parentId, body)`：取 parent 留言與其 `invite.createdById`，僅當 `createdById === session.user.id` 才允許（僅授課老師）。建立 `parentId` 回覆。`createNotification(parent.authorId, ...)`，作者即老師時略過。
- `deleteCourseMessage(messageId)`：取 message（含 `invite.createdById`、`authorId`）。允許條件：`message.authorId === uid || invite.createdById === uid`。刪除（cascade 處理回覆）。不發通知。
- 各 action 結束 `revalidatePath('/course/${inviteId}')`，回傳 `ActionResponse`。

### 3. 內容驗證 `lib/schemas/course-message.ts`
Zod：`body` 必填、trim 後 1–2000 字。

### 4. 資料查詢 `lib/data/course-message.ts`
`getCourseMessages(inviteId)`：取該課程所有訊息，含 `author`（供 `getMemberDisplayName`）。組成「提問（依 createdAt 升序）＋每則提問的回覆（升序）」結構回傳。

### 5. UI 整合
- 課程頁底部新增 FAQ 區塊（Server 渲染既有訊息），傳入 `currentUserId`、`isInstructor`、`messages`。
- Client 元件：
  - `course-faq-form`（提問輸入框，所有會員可見）。
  - 每則提問下：回覆清單；老師可見回覆輸入框；刪除按鈕依權限（作者或老師）顯示，AlertDialog 二次確認。
- 取消 / 結業課程仍顯示 FAQ（唯讀歷史可保留可提問；本版不依課程狀態鎖定，保持簡單）。

## Risks / Trade-offs

- **無編輯**：誤植只能刪除重發（可接受）。
- **公開可見**：任何登入會員都看得到全部問答，符合 FAQ 定位；不含私訊。
- **cascade 刪除**：老師刪提問會連帶刪掉學員回覆紀錄（本版回覆僅老師可發，影響有限）。
- **DB schema 變更**：apply 需執行 `make schema-update`（容器內 prisma migrate）；於無 Docker 環境需人工執行。

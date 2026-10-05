## Context

`deleteMember`（`app/actions/admin.ts:288-326`）目前的刪除流程：

```ts
await prisma.$transaction(async (tx) => {
  await tx.inviteEnrollment.deleteMany({ where: { userId } })
  await tx.courseInvite.deleteMany({ where: { createdById: userId } })
  await tx.user.delete({ where: { id: userId } })
  await tx.adminActionLog.create({ data: { action: 'member_delete', ... } })
})
```

`User` 的關聯表中，以下欄位在 migration 裡設為 `ON DELETE RESTRICT`（其餘多為 `Cascade`/`SetNull`，不會擋刪除）：

| 約束名稱 | 關聯表.欄位 | 目前是否被 `deleteMember` 清理 |
|---|---|---|
| `course_invites_createdById_fkey` | `CourseInvite.createdById` | 是（但若班級下還有其他學員的 `InviteEnrollment` 未清除，這一步本身會先被 `invite_enrollments_inviteId_fkey` 擋下） |
| `invite_enrollments_userId_fkey` | `InviteEnrollment.userId` | 是（`deleteMember` 第一步就清空） |
| `conversations_createdById_fkey` | `Conversation.createdById` | 否 |
| `conversation_messages_authorId_fkey` | `ConversationMessage.authorId` | 否 |
| `course_messages_authorId_fkey` | `CourseMessage.authorId` | 否 |

本次不改動清理順序或新增清理步驟（那是另一張 CR 的範圍），只處理「清理失敗時如何讓使用者知道原因」。

## Goals / Non-Goals

**Goals:**
- 刪除因外鍵約束失敗時，使用者（客服／管理者）能在畫面上看到具體、可理解的中文原因，不是未預期的錯誤畫面。
- 不確定是哪個約束導致的情況（未來新增關聯表、或 Prisma 回傳格式超出預期）要有誠實的 fallback，不可偽裝成功。

**Non-Goals:**
- 不自動清除擋住的資料、不自動轉移班級（見 `cr-feat-261005-001`）。
- 不改變刪除的清理順序與範圍。
- 不處理「前端顯示」以外的其他管理操作（例如 `suspendMember`）的錯誤訊息，本次只針對 `deleteMember`。

## Decisions

### 決策：在 `deleteMember` 內 catch `P2003`，依約束名稱回傳對應訊息

**實測修正（task 1.3 於 project_a 自己的 dev 容器內，用 `docker compose exec web` 透過 web 容器的內部網路連到 project_a 自己的 `db` 服務——project_a 的 `db` 服務在 `docker-compose.yml` 未對外 publish port，host 的 5432 其實被另一個專案的容器占用，直接從 host 連 `.env` 的 `DATABASE_URL_DEV` 會連到錯誤的資料庫且無明顯錯誤提示，必須透過 `docker compose exec web` 走容器內部網路）**：

Prisma 官方文件對 P2003 `error.meta` 的描述（`{ field_name: string }`）是舊版引擎格式。本專案用 Prisma 7.5.0 + `@prisma/adapter-pg`（`lib/prisma.ts` 的 driver adapter 模式），實測觸發一次真實的 P2003 後，`error.meta` 實際長這樣：

```json
{
  "modelName": "User",
  "driverAdapterError": {
    "name": "DriverAdapterError",
    "cause": {
      "originalCode": "23503",
      "originalMessage": "update or delete on table \"users\" violates foreign key constraint \"conversations_createdById_fkey\" on table \"conversations\"",
      "kind": "ForeignKeyConstraintViolation",
      "constraint": { "index": "conversations_createdById_fkey" }
    }
  }
}
```

約束名稱在 `error.meta.driverAdapterError.cause.constraint.index`，不是 `error.meta.field_name`。原始設計已依此修正並重新實測通過。

**第二個實測修正（同樣在 task 1.3 過程中發現）**：還原本次事件的真實情境（講師帳號開的班級底下還有其他學員報名）後實測，實際擋下 `tx.courseInvite.deleteMany(...)` 這一步的約束名稱是 **`invite_enrollments_inviteId_fkey`**，不是原本設計假設的 `course_invites_createdById_fkey`。原因：`course_invites_createdById_fkey` 是「`User` 被刪除時，是否還有 `CourseInvite.createdById` 指向它」的約束，但 `deleteMember` 會先執行 `courseInvite.deleteMany({ createdById: userId })`；如果這個班級底下還有其他學員的 `InviteEnrollment`，則是刪除 `CourseInvite` 這個動作本身先違反 `invite_enrollments_inviteId_fkey`（`InviteEnrollment.inviteId → CourseInvite`），根本輪不到 `course_invites_createdById_fkey` 被檢查。對照表已修正為兩個 key 都指向同一則訊息（`invite_enrollments_inviteId_fkey` 是實際會觸發的、`course_invites_createdById_fkey` 保留作為未來清理順序調整時的防呆，理論上目前這個版本的程式碼不會觸發它）。已補測「班級由該會員建立但沒有其他學員報名」情境，確認能正常刪除成功，不會誤判擋下。

**做法**：

```ts
import { Prisma } from '@prisma/client'

const FK_RESTRICT_MESSAGES: Record<string, string> = {
  // 實測確認：班級下仍有其他學員報名時，實際觸發的是這個約束（見上方實測修正說明）
  invite_enrollments_inviteId_fkey:
    '無法刪除：此會員是某個班級的建立者（講師），且班級下仍有其他學員的報名記錄。請先將該班級轉移給其他老師，或確認相關學員資料已處理後再試。',
  // 理論上目前程式碼不會觸發（courseInvite.deleteMany 若成功，刪除當下該會員名下已無 CourseInvite），保留作防呆
  course_invites_createdById_fkey:
    '無法刪除：此會員是某個班級的建立者（講師），且班級下仍有其他學員的報名記錄。請先將該班級轉移給其他老師，或確認相關學員資料已處理後再試。',
  conversations_createdById_fkey:
    '無法刪除：此會員曾發起站內對話，系統保留對話記錄以維持其他參與者的歷史訊息完整，無法直接刪除此帳號。',
  conversation_messages_authorId_fkey:
    '無法刪除：此會員曾在站內對話中發過訊息，系統保留訊息記錄以維持對話完整性，無法直接刪除此帳號。',
  course_messages_authorId_fkey:
    '無法刪除：此會員曾在課程留言功能中發過留言，系統保留留言記錄，無法直接刪除此帳號。',
}
const FK_RESTRICT_FALLBACK_MESSAGE =
  '無法刪除：此會員仍有其他系統資料關聯（原因未分類），請聯繫工程人員協助確認。'

function extractFkConstraintName(error: Prisma.PrismaClientKnownRequestError): string {
  const index = (
    error.meta as
      | { driverAdapterError?: { cause?: { constraint?: { index?: unknown } } } }
      | undefined
  )?.driverAdapterError?.cause?.constraint?.index
  return typeof index === 'string' ? index : ''
}

try {
  await prisma.$transaction(async (tx) => {
    // ...既有清理與刪除邏輯不變
  })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    const constraintName = extractFkConstraintName(error)
    const message = FK_RESTRICT_MESSAGES[constraintName] ?? FK_RESTRICT_FALLBACK_MESSAGE
    console.error('[deleteMember] FK constraint violated', { userId, constraintName, error })
    return { success: false, message }
  }
  throw error // 非外鍵約束錯誤，維持原本行為往上拋（不在本次處理範圍內，避免掩蓋未知問題）
}

return { success: true, message: '會員已刪除' }
```

**理由**：
- 用 `Prisma.PrismaClientKnownRequestError` 搭配 `error.code === 'P2003'` 是 Prisma 官方建議的已知錯誤判斷方式，比對照既有 `lib/auth.ts` 用的 `'code' in e` 寫法更明確。
- 約束名稱的擷取邏輯獨立成 `extractFkConstraintName`，並以型別斷言明確標註「這是 driver adapter 的實際巢狀結構，非官方文件的扁平 `field_name`」，避免未來升級 Prisma 版本或切換回非 adapter 模式時，有人依官方文件直覺改回 `error.meta.field_name` 卻沒注意到本專案用的是 adapter 模式。
- 約束名稱對照表只涵蓋目前已知的 RESTRICT 關聯；未命中的約束名稱改回傳通用但誠實的訊息並記錄完整錯誤到 server log，不在前端編造使用者看不懂也無法行動的細節，也不假裝刪除成功。
- 非 `P2003` 的例外（例如資料庫斷線）維持原本往上拋的行為，不在本次改動範圍內新增額外的錯誤處理分支，避免掩蓋其他本來就該被看見的系統錯誤。

### 決策：前端不需修改

`member-delete-button.tsx` 既有的 `if (result.success) ... else toast.error(result.message ?? ...)` 已經是正確邏輯，問題只在後端從未回傳失敗的 `ActionResponse`。本次驗收時會實際操作一次確認 toast 正確顯示，但不預期需要改動這個檔案。

## Risks / Trade-offs

- [約束名稱對照表需要手動維護，未來新增 RESTRICT 關聯忘記補對照表時會落入 fallback 訊息] → 可接受：fallback 訊息雖不夠具體，但仍會讓使用者知道「有關聯資料擋住」而非完全無提示，且 server log 會記錄完整約束名稱方便工程排查、之後補表。
- [`error.meta` 的巢狀結構是 `@prisma/adapter-pg` 這個 driver adapter 的實作細節，未必跨 Prisma 版本穩定] → 已用 `extractFkConstraintName` 集中處理並加註解說明來源，未來 Prisma 升級若改變此結構，只需改這一個函式；已於 task 1.3 實測記錄於本文件，供日後比對差異。

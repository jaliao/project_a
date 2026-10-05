## Context

現況（研究確認，見下列檔案行號）：

- 會員詳情頁「授課紀錄」：`app/[locale]/(admin)/admin/members/[id]/page.tsx:224-251`，資料來自 `getMemberDetail()`（`lib/data/members.ts:97-192`），`courseInvites` select 於第 166-183 行，已含 `id, title, courseCatalogId, courseCatalog.label, _count.enrollments` 等欄位，足夠 Dialog 顯示清單用，**不需要額外補欄位**（proposal.md 原先保留的可能性，實測後確認不需要）。
- 專案裡唯一的通用「挑人」UI 元件是 `components/shared/student-picker.tsx` 的 `StudentPicker`：純展示＋callback，不含任何授權/角色過濾邏輯（過濾邏輯都在個別 Server Action 層），可直接重用元件殼，只需另寫一個回傳「符合資格老師」的 `onSearch` 查詢函式，不需要另外做一個 `TeacherPicker` 元件。
- `AdminActionLog`（`prisma/schema/admin-log.prisma:12-37`）沒有陣列/JSON 欄位，`inviteId` 是單一 FK；專案既有慣例（`deleteMember`、`addStudentToInvite`/`removeStudentFromInvite`）都是「資料異動 + 同交易內 `tx.adminActionLog.create`」。批次操作要寫多筆 log 時，沿用「逐筆建立」而非塞進一筆的 `detail` 文字裡（這樣清單頁能個別篩出每個班級的紀錄）。
- **已有同類驗證邏輯可直接沿用**：`app/actions/course-session.ts:73-98`「代講師開課」（`isOnBehalf` 分支）——管理者可指定 `targetTeacherId` 代替某老師建立 `CourseInvite`，驗證方式是 `hasRole(targetTeacher.roles, TEACHER_ROLE_BY_CATALOG[courseCatalogId])`，刻意不用 `canTeachBook()`（後者對 admin/superadmin 會 override 回傳 true）。本次「轉移」在語意上更嚴格（不是「代為授課」而是「正式交接班級所有權」），理當至少比照這個既有精神：目標老師必須「實際持有」對應書籍講師身分。

## Goals / Non-Goals

**Goals:**
- 管理者可以把某位老師名下的班級（可指定部分或全部）轉移給另一位「實際具備對應講師身分」的老師。
- 轉移後，原本被 `course_invites_createdById_fkey` / `invite_enrollments_inviteId_fkey` 卡住的刪除會員流程，在來源老師名下已無班級時能自然解套（不需要额外改動 `deleteMember`）。
- 轉移動作要可稽核（誰在何時把哪些班級從 A 轉給 B）。

**Non-Goals:**
- 不做「自動建議目標老師」。
- 不支援跨 `courseCatalogId` 的彈性例外（例如「目標老師暫時沒身分但先允許轉移、之後再補身分」）——本次嚴格要求轉移當下就必須符合資格，避免班級又卡進另一個無法刪除的狀態。
- 不修改 `cr-fix-261005-001` 已完成的錯誤訊息文字。

## Decisions

### 決策 1：重用 `StudentPicker` 元件殼，另寫 `searchTeacherCandidates` 取代 `onSearch`

**做法**：`lib/data/teacher-picker.ts` 新增：

```ts
export type TeacherPickerCandidate = {
  userId: string
  spiritId: string | null
  displayName: string
  avatarUrl: string | null
  email: string
}

/**
 * 依「必須同時具備的書籍講師身分」過濾候選老師（hasEvery，因為一次轉移可能涵蓋多本書的班級）。
 * 不吃 admin/superadmin override——轉移目標必須實際持有該身分（理由見 design.md）。
 */
export async function searchTeacherCandidates(
  requiredRoles: TeacherRole[],
  query: string,
  excludeUserIds: string[]
): Promise<TeacherPickerCandidate[]> {
  const q = query.trim()
  if (!q || requiredRoles.length === 0) return []

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: excludeUserIds },
      roles: { hasEvery: requiredRoles },
      OR: [
        { realName: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { nickname: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { spiritId: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: [{ realName: 'asc' }],
    take: 20,
    select: { id: true, spiritId: true, email: true, avatarKey: true, image: true, realName: true, englishName: true, nickname: true, displayNameMode: true },
  })

  return users.map((u) => ({
    userId: u.id,
    spiritId: u.spiritId,
    displayName: getMemberDisplayName(u),
    avatarUrl: resolveAvatarUrl(u),
    email: u.email,
  }))
}
```

前端 `MemberCourseInviteTransfer`（新 client component）直接 `<StudentPicker friends={[]} onSearch={...} title="選擇目標老師" description="輸入啟動編號、姓名、暱稱或 Email 搜尋具備對應講師身分的老師" onSelect={...} />`——`StudentPickerSelection` 回傳形狀（`userId/spiritId/displayName/avatarUrl/isFriend`）比 `TeacherPickerCandidate` 多一個 `isFriend`，呼叫端轉接時固定帶 `isFriend: false` 即可（元件只用它決定要不要顯示「好友」徽章，不影響邏輯）。

**理由**：元件文件註解明寫「不含任何授權/資料範圍邏輯，純展示＋回呼」，過濾完全在 `onSearch` callback 裡決定，天生就是為了這種場景設計的，另做一個幾乎一樣的 `TeacherPicker` 元件是不必要的重複。

### 決策 2：目標老師資格驗證——嚴格 `hasRole`，不用 `canTeachBook`

**做法**：`transferCourseInvites` 內：

```ts
const invites = await prisma.courseInvite.findMany({
  where: { id: { in: inviteIds } },
  select: { id: true, title: true, createdById: true, courseCatalogId: true, courseCatalog: { select: { label: true } } },
})
if (invites.length !== inviteIds.length) return { success: false, message: '部分班級不存在，請重新整理頁面' }
if (invites.some((i) => i.createdById !== fromUserId)) {
  return { success: false, message: '部分班級不屬於來源老師，請重新整理頁面' }
}

const requiredCatalogIds = [...new Set(invites.map((i) => i.courseCatalogId))]
const requiredRoles = requiredCatalogIds.map((id) => TEACHER_ROLE_BY_CATALOG[id]).filter((r): r is TeacherRole => !!r)

const toUser = await prisma.user.findUnique({ where: { id: toUserId }, select: { id: true, roles: true, realName: true, name: true, email: true } })
if (!toUser) return { success: false, message: '找不到目標老師' }

const missingLabels = requiredCatalogIds
  .filter((id) => {
    const role = TEACHER_ROLE_BY_CATALOG[id]
    return !role || !hasRole(toUser.roles, role)
  })
  .map((id) => invites.find((i) => i.courseCatalogId === id)!.courseCatalog.label)
if (missingLabels.length > 0) {
  return { success: false, message: `目標老師須具備「${missingLabels.join('、')}」講師身分才能接收這些班級` }
}
```

**理由**：比照 `course-session.ts:88-91` 既有的「代講師開課」驗證邏輯——那裡明確選擇不用 `canTeachBook()`（它對 admin/superadmin 一律 override 為 true），因為「這個人是否真的能代表這本書授課/擁有這個班級」是比「這個人是否有權限操作後台」更嚴格的業務語意。轉移班級屬於同一類「指派實際教學責任歸屬」的操作，沿用同一判斷基準，避免兩處邏輯不一致。

### 決策 3：批次轉移在單一交易內完成，逐班級各寫一筆 `AdminActionLog`

**做法**：

```ts
await prisma.$transaction(async (tx) => {
  await tx.courseInvite.updateMany({
    where: { id: { in: inviteIds } },
    data: { createdById: toUserId },
  })
  for (const invite of invites) {
    await tx.adminActionLog.create({
      data: {
        action: 'course_invite_transfer',
        actorId: session.user.id,
        actorName,
        targetUserId: toUserId,
        targetName: toTeacherSnapshot,
        inviteId: invite.id,
        inviteTitle: `#${invite.id} ${invite.title}`,
        detail: `班級所有權由 ${fromTeacherSnapshot} 轉移至 ${toTeacherSnapshot}`,
      },
    })
  }
})
```

**理由**：`AdminActionLog.inviteId` 是單一 FK（schema 本身的限制，見 Context），專案既有慣例也都是「一個操作對象一筆 log」。逐筆寫入雖然在轉移很多班級時會產生多筆 log，但換來的是每筆紀錄都能被既有的「操作紀錄」頁面依 `inviteId` 正確歸類查詢，不需要額外解析 `detail` 裡的文字清單。

### 決策 4：`transferCourseInvites` 僅限管理者操作

**做法**：函式開頭 `if (!canAccessAdmin(session.user.roles)) return { success: false, message: '無權限' }`，不像 `canManageInvite()` 那樣額外放行「該課建立者本人」。

**理由**：proposal 的需求描述明確是「管理者可選來源老師、目標老師」——這是一個人事/資源交接操作，不應該讓老師自己任意把班級轉給別人（可能造成未經管理者同意的責任轉移）。

## Risks / Trade-offs

- [批次轉移很多班級時會產生對應數量的 `AdminActionLog`] → 可接受：符合既有稽核慣例，且實務上一次轉移的班級數量不會太多（遠低於會造成效能疑慮的量級）。
- [嚴格要求目標老師「實際持有」身分，無法先轉移再補身分] → 刻意設計：避免班級所有權卡進另一個「無法刪除」的狀態，管理者應該先用「設定講師身分授權」（既有 `grantTeacherRole`）補上身分，再做轉移，兩個操作本來就分屬不同管理頁面/關注點，不需要在轉移這一步耦合進去。
- [`StudentPicker` 重用時 `isFriend` 欄位語意被挪用（恆為 false）] → 可接受：只影響是否顯示「好友」徽章，不影響功能正確性；若未來要更精緻的區分可再評估獨立元件，本次不過度設計。

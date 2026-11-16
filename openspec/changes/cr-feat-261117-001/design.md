## Context

CR-FEAT-261116-001 已建立 `getViewableLearningCatalogIds(viewerId, authorId)` / `canViewLearningCatalog(viewerId, authorId, courseCatalogId)`，三條件（本人／好友／同班）皆以「回傳作者對查看者可見的課程目錄 id 集合」為核心。本次新增第四條件「講師」，結構上與既有「同班」條件非常相似——都是比對 `InviteEnrollment`，差別在於比對的鍵不同：「同班」比對雙方是否在**同一個 `inviteId`** 下皆為 approved；「講師」比對**查看者的 `inviteId`** 的 `createdById` 是否等於作者（因為作者是講師本人，不一定在 `InviteEnrollment` 裡有自己的報名記錄——講師是以 `CourseInvite.createdById` 身分存在，不透過 `InviteEnrollment`）。

課程詳情頁（`app/[locale]/(user)/course/[id]/page.tsx`）已有 `teacherName = getMemberDisplayName(courseSession.createdBy)`（第 92 行），但 `courseSession.createdBy` 的查詢來自 `lib/data/course-sessions.ts:350` 的 `createdBy: { select: { ...displayNameUserSelect, phone: true } }`，而 `displayNameUserSelect`（同檔第 14-21 行）不含 `spiritId`，需補上才能組出連結目標。

社群頁共用元件 `components/community/student-card.tsx` 已經接收 `spiritId?: string | null` prop（第 25 行），只是元件內部目前只用它顯示文字，沒有包成連結；`friends-list.tsx`／`match-board/student-matching-list.tsx` 兩個呼叫端已經把 `spiritId` 傳進去，不需要改呼叫端。

課程詳情頁「已核准學員卡片」已有同類的連結模式可參考（`openspec/specs/course-session-detail/spec.md` 的「已核准學員清單與卡片」Requirement）：比照 `components/admin/member-home-link.tsx` 的連結慣例——`spiritId` 存在才產生連結、開新分頁（`target="_blank"`、`rel="noopener noreferrer"`）、`spiritId` 為 `null` 時維持純顯示。本次兩處新增連結（講師姓名、社群會員卡）沿用同一慣例。

## Goals / Non-Goals

**Goals:**
- 課程詳情頁講師姓名、社群會員卡（好友／找學員頁籤共用）頭像與姓名，皆可點擊導向 `/user/{spiritId}` 個人首頁。
- 學生對自己上課講師在「該堂課對應課程目錄」的分段查經筆記可唯讀查看，範圍比照「同班」（不擴大到講師所有已解鎖目錄）。
- 複用既有連結慣例（`member-home-link.tsx` 風格）與既有可見性函式簽章，不新增新的對外介面。

**Non-Goals:**
- 不開放「講師看學生」或任何反向規則。
- 不擴大講師可見範圍到其所有已解鎖課程目錄（已與需求方確認維持窄範圍）。
- 不新增好友／同班以外的其他可見性入口（例如「同教會」「同單位」皆不在本次範圍）。
- 不處理講師本身沒有該課程目錄筆記的情況的特殊提示——沒有筆記時沿用既有「尚未填寫」唯讀空狀態，不特別區分原因。

## Decisions

### 1. 可見性判斷：`getViewableLearningCatalogIds` 新增第四個查詢分支「講師」

於既有的 `Promise.all` 中新增第三條查詢（與「同班」的兩條查詢並列執行），比對查看者（學生）是否在某個由作者（講師）開課（`createdById = authorId`）的課程中有 `approved`、未取消的報名，且該課程對應的課程目錄在作者已解鎖的目錄集合內：

```ts
export async function getViewableLearningCatalogIds(
  viewerId: string,
  authorId: string
): Promise<number[]> {
  const authorUnlockedIds = await getUnlockedLearningCatalogIds(authorId)
  if (viewerId === authorId) return authorUnlockedIds
  if (authorUnlockedIds.length === 0) return []

  if (await isFriend(viewerId, authorId)) return authorUnlockedIds

  const [authorRows, viewerRows, instructorRows] = await Promise.all([
    prisma.inviteEnrollment.findMany({
      where: {
        userId: authorId,
        status: 'approved',
        invite: { cancelledAt: null, startedAt: { not: null }, courseCatalogId: { in: authorUnlockedIds } },
      },
      select: { inviteId: true, invite: { select: { courseCatalogId: true } } },
    }),
    prisma.inviteEnrollment.findMany({
      where: { userId: viewerId, status: 'approved', invite: { cancelledAt: null } },
      select: { inviteId: true },
    }),
    // 新增：viewer 是否為某堂「authorId 擔任講師」的課程之 approved 學員
    prisma.inviteEnrollment.findMany({
      where: {
        userId: viewerId,
        status: 'approved',
        invite: { cancelledAt: null, createdById: authorId, courseCatalogId: { in: authorUnlockedIds } },
      },
      select: { invite: { select: { courseCatalogId: true } } },
    }),
  ])

  const viewerInviteIds = new Set(viewerRows.map((r) => r.inviteId))
  const visibleCatalogIds = new Set<number>()
  for (const row of authorRows) {
    if (viewerInviteIds.has(row.inviteId)) visibleCatalogIds.add(row.invite.courseCatalogId)
  }
  for (const row of instructorRows) {
    visibleCatalogIds.add(row.invite.courseCatalogId)
  }
  return Array.from(visibleCatalogIds)
}
```

（示意碼僅表達查詢意圖，實作時以實際 Prisma where 語法與型別為準。）`canViewLearningCatalog` 不需改動，已包裝此函式。

講師（instructor）條件刻意**不**檢查 `invite.startedAt`（與「同班」條件中查看者一側的查詢一致）——只要學生的報名是 `approved` 且課程未取消即視為成立，不要求課程已實際開課，避免與「同班」條件的既有語意不一致。

### 2. 課程詳情頁：補 `spiritId` 查詢欄位 + 講師姓名改為連結

`lib/data/course-sessions.ts:350` 的 `createdBy: { select: { ...displayNameUserSelect, phone: true } }` 改為 `createdBy: { select: { ...displayNameUserSelect, phone: true, spiritId: true } }`。

`app/[locale]/(user)/course/[id]/page.tsx:309-318` 原本：

```tsx
<p className="font-medium">{teacherName}</p>
```

改為（`spiritId` 存在才包 `Link`，比照 `member-home-link.tsx` 慣例，開新分頁）：

```tsx
{courseSession.createdBy.spiritId ? (
  <Link
    href={`/user/${courseSession.createdBy.spiritId.toLowerCase()}`}
    target="_blank"
    rel="noopener noreferrer"
    className="font-medium underline-offset-2 hover:underline"
  >
    {teacherName}
  </Link>
) : (
  <p className="font-medium">{teacherName}</p>
)}
```

### 3. 社群會員卡：`StudentCard` 內部將頭像與姓名包成連結

`components/community/student-card.tsx` 內，`avatarUrl`／`displayName` 所在區塊改為：`spiritId` 存在時以 `Link`（`@/i18n/navigation` 的 locale-aware `Link`，與站內其他導向一致，開同分頁——此為站內個人首頁導覽，非「已核准學員清單」那種需要保留課程詳情頁分頁的場景）包住頭像與姓名文字；`spiritId` 為 `null` 時維持現有純文字／純圖片。`friends-list.tsx`、`match-board/student-matching-list.tsx` 两個呼叫端不需改動——`spiritId` 早已作為 prop 傳入，連結邏輯完全封裝在 `StudentCard` 內部。

此處**不**比照「已核准學員清單」卡片用 `target="_blank"` 開新分頁：那是從課程詳情頁（通常需要保留原頁面脈絡）跳出去；社群頁的好友卡／找學員卡屬於站內一般導覽情境，與既有 `UserAvatar`／顯示名稱等其他站內連結的開啟方式一致（同分頁）。

### 4. 範圍確認：講師可見範圍比照「同班」（窄範圍）

已與需求方確認：學生只能看到自己正在上的那堂課、對應課程目錄的講師筆記，不開放講師所有已解鎖課程目錄（那是「好友」條件的範圍）。好處：語意清楚（「這堂課的老師在這個主題寫了什麼」），且實作上重用既有查詢模式，不需額外的效能考量。

## Risks / Trade-offs

- 若講師本身未曾在該課程目錄填寫過分段查經筆記（`authorUnlockedIds` 不含該目錄，或填了但目錄未解鎖），學生不會看到任何內容——此為現有「尚未填寫」唯讀空狀態，不特別區分原因，與現行好友／同班情境一致。
- 課程詳情頁與社群會員卡两處連結開啟方式不同（分別為新分頁／同分頁），刻意依情境區分而非統一，已在上方決策中說明理由。

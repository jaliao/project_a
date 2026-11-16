## Context

現有兩個資料來源已足以判斷「同班」與「好友」，不需新增資料表或欄位：

- `InviteEnrollment`（`userId` + `inviteId` + `status`）：`lib/data/learning-study.ts` 的 `getUnlockedLearningCatalogIds(userId)` 已示範「approved、所屬開課未取消、`startedAt` 已設定」這套查詢模式。
- `Friendship`（單向，`ownerId` 加 `friendId`）：`lib/data/friendship.ts` 已有 `isFriend(ownerId, friendId): Promise<boolean>`，語意恰好等於「`ownerId` 已將 `friendId` 加入好友清單」，可直接複用，不需新增函式。

`LearningStudyEntry` 只存 `userId` + `courseCatalogId`（不記錄撰寫當下對應哪一次 `inviteId`），因此「同班」只能在查詢時以「作者目前在這個課程目錄下的 approved 報名」為準動態比對，無法回溯到筆記撰寫當下的那一梯——此為已在 proposal 中與需求方確認接受的已知取捨。

個人首頁（`app/[locale]/(user)/user/[spiritId]/page.tsx`）目前已經對「他人視角」做兩個相關查詢：`isFriendWithUser`（供加好友按鈕）與 `allEnrollments`／`inProgressCatalogIds`（供課程列表與進度卡）。`CourseProgressCards` 元件（`components/learning/course-progress-cards.tsx`）第 58 行 `linkable = isOwnPage && (!!cert || isInProgress) && progress != null` 是唯一需要放寬可點擊條件的地方。

## Goals / Non-Goals

**Goals:**
- 查看者在「本人」「同班（同一具體開課 approved）」「好友（查看者已將作者加好友）」三者之一成立時，可唯讀查看作者在某課程目錄下的分段查經筆記。
- 不異動 `LearningStudyEntry` 資料表結構，不做任何 backfill migration。
- 既有「僅本人可編輯/刪除」「不提供個人隱私開關」「管理者後台不可見學員筆記內容」三項既有限制維持不變。
- 複用現有查詢能力（`InviteEnrollment` 查詢模式、`isFriend`），不新增重複的好友/報名判斷邏輯。

**Non-Goals:**
- 不精準區分「同一課程種類、不同梯次」的筆記可見範圍（已知取捨，見 proposal）。
- 不做效能優化的強制要求（快取/彙總表留待實作時依資料量評估，非本次驗收項）。
- 不開放管理者後台檢視學員筆記內容（本次異動範圍僅學員端的他人唯讀查看）。
- 不新增「取消好友即收回歷史可見內容」以外的特殊收回機制——好友關係解除後即時生效（下次查詢时 `isFriend` 為 false），不特別處理「曾經看過」的快取或記錄。

## Decisions

### 1. 可見性判斷：新增 `getViewableLearningCatalogIds`，資料層函式，不走 Server Action

於 `lib/data/learning-study.ts` 新增：

```ts
/**
 * 查看者可唯讀查看「某作者」哪些課程目錄的分段查經筆記。
 * 條件（任一成立即可見）：
 *   1. viewerId === authorId（本人）
 *   2. isFriend(viewerId, authorId)（查看者已將作者加好友）→ 作者「已解鎖」的全部課程目錄皆可見
 *   3. 同班：作者在該課程目錄下有 approved 報名（inviteId 集合 A），
 *      查看者在同一課程目錄下也有 approved 報名且 inviteId 落在集合 A 內
 */
export async function getViewableLearningCatalogIds(
  viewerId: string,
  authorId: string
): Promise<number[]> {
  const authorUnlockedIds = await getUnlockedLearningCatalogIds(authorId)
  if (viewerId === authorId) return authorUnlockedIds
  if (authorUnlockedIds.length === 0) return []

  if (await isFriend(viewerId, authorId)) return authorUnlockedIds

  // 同班：依課程目錄分別比對 inviteId 集合是否有交集
  const [authorRows, viewerRows] = await Promise.all([
    prisma.inviteEnrollment.findMany({
      where: {
        userId: authorId,
        status: 'approved',
        invite: { cancelledAt: null, startedAt: { not: null } },
        invite: { courseCatalogId: { in: authorUnlockedIds } },
      },
      select: { inviteId: true, invite: { select: { courseCatalogId: true } } },
    }),
    prisma.inviteEnrollment.findMany({
      where: { userId: viewerId, status: 'approved', invite: { cancelledAt: null } },
      select: { inviteId: true },
    }),
  ])
  const viewerInviteIds = new Set(viewerRows.map((r) => r.inviteId))
  const visibleCatalogIds = new Set<number>()
  for (const row of authorRows) {
    if (viewerInviteIds.has(row.inviteId)) visibleCatalogIds.add(row.invite.courseCatalogId)
  }
  return Array.from(visibleCatalogIds)
}

/** 單一課程目錄版本，供子頁路由守衛使用 */
export async function canViewLearningCatalog(
  viewerId: string,
  authorId: string,
  courseCatalogId: number
): Promise<boolean> {
  if (viewerId === authorId) return true
  const ids = await getViewableLearningCatalogIds(viewerId, authorId)
  return ids.includes(courseCatalogId)
}
```

（上列為決策說明用的示意實作，實作時以實際 Prisma where 語法為準；`invite` 條件重複 key 需合併為單一 where 物件，示意碼僅表達查詢意圖。）

採資料層函式而非 Server Action：這是純讀取查詢，與既有 `getUnlockedLearningCatalogIds`／`getStudyEntriesForUser` 同層級，由頁面（Server Component）直接呼叫即可，不需要 `'use server'` 的表單語意。

好友條件授予「作者全部已解鎖課程目錄」而非「好友關係成立當下作者已有筆記的目錄」：與 proposal 的好友語意一致（好友＝可看對方全部查經筆記，不限課程種類），且與「已解鎖」口徑一致（避免把「尚未開課」的目錄也顯示出來造成混淆）。

### 2. 路由層：兩層頁面改為「先查可見性，再決定 redirect 或唯讀渲染」

**`/user/{spiritId}/learning`**（`app/[locale]/(user)/user/[spiritId]/learning/page.tsx`）：

- 原本「`session.user.spiritId !== spiritId` 就直接 redirect」的判斷，改為：
  1. 若為本人 → 現有流程不變（可寫入視角）。
  2. 若非本人 → 查 `getViewableLearningCatalogIds(viewer.id, author.id)`；若回傳空陣列 → 維持現行 redirect 回本人頁面；若非空 → 以唯讀模式渲染書籍選擇頁，`cards` 僅保留回傳清單中的課程目錄（其餘目錄的卡片不渲染，而非顯示鎖定樣式——避免洩漏「這個人其實上過這堂課但你看不到」的細節沒有必要，直接不顯示更單純）。
  3. 未登入 → 現行行為不變（導向 `/login`）。
- 唯讀模式下頁面標題文案調整為「{displayName} 的分段式查經」（他人視角），本人視角維持原「分段式查經」文案不變。
- 唯讀模式下每張可進入的課程目錄卡片一律視為 `canEnter: true`（不顯示「尚未開課」等鎖定文案，因為能顯示出來本身已代表可見）。

**`/user/{spiritId}/learning/{catalogId}`**（`app/[locale]/(user)/user/[spiritId]/learning/[catalogId]/page.tsx`）：

- 原本「非本人直接 redirect」改為：
  1. 本人 → 現有流程不變。
  2. 非本人 → 查 `canViewLearningCatalog(viewer.id, author.id, catalogId)`；為 `true` → 唯讀模式渲染；為 `false` → 維持現行 redirect（導回查看者自己對應的 `catalogId` 子頁，沿用既有「swap spiritId 保留 catalogId」的 redirect 目標寫法）。
  3. 未登入 → 現行行為不變。
- 唯讀模式渲染時：
  - `LessonAccordion` 與 `StudyEntryCard` 新增 `readOnly?: boolean` prop（預設 `false`，不影響既有呼叫點）。
  - `readOnly` 時：尚無筆記的經文項目格子**不渲染建立表單**，改顯示與現行「待填寫」視覺一致的靜態提示（不可互動）；已有筆記的格子渲染 `StudyEntryCard` 但隱藏「編輯」按鈕。
  - 「本課次無分段查經」提示、課次四態配色、展開/收合互動（含 `localStorage` 記憶，仍逐 `spiritId`／`courseCatalogId` 區分，不互相污染）皆維持不變，唯讀模式只影響格子內部是否可編輯。
  - orphan 筆記區塊（既有「孤兒」筆記展示）唯讀模式下同樣隱藏編輯按鈕；邏輯比照正常格子處理，不特別排除。

### 3. 個人首頁進度卡：放寬 `linkable` 條件

`components/learning/course-progress-cards.tsx` 第 58 行：

```ts
// 原：const linkable = isOwnPage && (!!cert || isInProgress) && progress != null
const linkable = (isOwnPage || viewableCatalogIds.includes(course.id)) && (!!cert || isInProgress) && progress != null
```

新增 prop `viewableCatalogIds: number[]`（他人視角時由頁面傳入 `getViewableLearningCatalogIds` 的結果；本人視角可傳空陣列，因 `isOwnPage` 已短路成立不會用到）。呼叫端（`app/[locale]/(user)/user/[spiritId]/page.tsx`）在 `isOwnPage` 為 `false` 時額外呼叫一次 `getViewableLearningCatalogIds(viewer.id, user.id)` 並傳入。

此改動與「學習進度三卡（公開；已結業顯示學業完成時間）」既有「完成度數字對所有訪客公開」的現狀一致——本次只是讓「可點擊進入查看筆記內容」的範圍，從「僅本人」放寬為「本人／同班／好友」，完成度數字本身的公開程度不變。

### 4. 效能：初版直接查詢，不預先引入快取層

`getViewableLearningCatalogIds` 每次頁面渲染時查詢 `InviteEnrollment`（最多兩次 `findMany`）與一次 `isFriend`（`count`），資料量級與既有 `getUnlockedLearningCatalogIds` 相同量級，初版直接查詢。若未來資料量成長造成列表頁（例如好友清單批量判斷可見課程）效能問題，可在不變更本次定義的「可見性規則」前提下，於 `getViewableLearningCatalogIds` 內部疊加快取（如 `unstable_cache` 或 Redis）或建立 `inviteId → approved userId 清單` 的彙總查詢，對外函式簽章與呼叫端不需變動。

## Risks / Trade-offs

- 「同一課程種類上過兩梯」的使用者，其兩梯同學會看到彼此在該課程種類下的全部筆記（不分梯次）——已知取捨，已與需求方確認可接受，且預期實際發生人數很少。
- 好友關係單向即時生效（`isFriend` 查詢當下狀態），好友若事後被移除好友關係，下次查詢即失去可見性，但使用者當次 session 內若已看過內容，瀏覽器端沒有額外清除機制（與系統現有「訊息」等功能的好友可見性收回行為一致，非本次新增風險）。
- 個人首頁新增一次 `getViewableLearningCatalogIds` 查詢（他人視角時），對首頁載入時間有輕微增量；查詢量級與現有 `getUnlockedLearningCatalogIds` 相同，預期影響有限。

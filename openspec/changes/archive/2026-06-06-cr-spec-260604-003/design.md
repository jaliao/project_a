## Context

`CourseInvite`（`prisma/schema/course-invite.prisma`）已有 `notes`（內部備註）、`cancelledAt`、`startedAt`、`completedAt`、`expiredAt`、`createdById`。開課入口為開課精靈，建立邏輯在 `app/actions/course-session.ts`（`createCourseSession`，已含 `canTeach` 前置），驗證在 `lib/schemas/course-session.ts`（`courseSessionSchema`）。課程詳情頁（`app/(user)/course/[id]/`）已有講師專屬操作（取消、結業、複製連結）。布告欄將重用既有 `components/course-session/course-session-card.tsx` 與 `course-card-grid.tsx`。Topbar（`components/layout/topbar.tsx`）右上角已有新增課程／個人資料／通知按鈕。

## Goals / Non-Goals

**Goals:**
- 講師開課可選「公開媒合」（預設不公開）並填寫招募備註；事後可於詳情頁修改。
- 提供媒合布告欄：以標準課程卡片列出招募中的公開課程並顯示備註。
- Topbar 右上角提供布告欄入口，所有登入會員可進入。

**Non-Goals:**
- 不改既有邀請連結／直連報名流程；非公開課程行為不變。
- 不做媒合配對演算法、申請審核或聊天；布告欄僅為瀏覽 + 連往課程詳情報名。
- 不另做搜尋／分頁（資料量小，首版單頁列出）。

## Decisions

### 1. 資料模型
`CourseInvite` 新增：
- `isPublicMatch Boolean @default(false)` — 是否公開媒合（預設不公開）。
- `matchNote String?` — 公開招募備註（選填）。
migration `add_course_public_match`（純新增，無 backfill 風險）。`notes`（內部備註）與 `matchNote`（對外招募備註）語意分離、並存。

### 2. 布告欄顯示條件（招募中）
列出 `isPublicMatch = true` 且 `cancelledAt IS NULL` 且 `completedAt IS NULL` 且**未過邀請截止日**（`expiredAt IS NULL` 或 `expiredAt >= 今日`）的課程。排序：`createdAt` 由新到舊。
- **為何**：取消／已結業／已過截止日的課程不應再招生；started（進行中）仍可能補人，故不排除。

### 3. 公開媒合設定的寫入與編輯
- **建立時**：`courseSessionSchema` 新增 `isPublicMatch: boolean`（預設 false）與 `matchNote: string optional`（trim，最長 500 字）；`createCourseSession` 寫入。`isPublicMatch=false` 時忽略 `matchNote`。
- **編輯**：新增 Server Action `updateMatchSettings(inviteId, { isPublicMatch, matchNote })`，**僅課程講師（`createdById === session.user.id`）或管理者**可呼叫；關閉公開時清空或保留 `matchNote`（保留，方便再次開啟），但布告欄不顯示。回傳標準 ActionResponse，`revalidatePath` 詳情頁與布告欄。

### 4. 布告欄頁面與資料
- 路由：`app/(user)/match-board/page.tsx`（(user) 群組，所有登入會員可存取；Server Component）。
- 資料：`lib/data/` 新增 `getPublicMatchingSessions()`，select 課程卡片所需欄位 + `matchNote` + 講師顯示名。
- 卡片：重用 `CourseSessionCard`，新增**選填 prop**（如 `matchNote?: string`、`showMatchBadge?: boolean`）：顯示「公開媒合／招募中」badge 與招募備註區塊（無備註則不顯示備註區）。卡片點擊沿用既有行為（前往課程詳情報名）。

### 5. Topbar 入口
`Topbar` 新增「媒合布告欄」按鈕（Tabler icon，如 `IconClipboardList`），導向 `/match-board`，所有登入會員可見（不需 roles 判斷）。置於右上角按鈕群組（回首頁／布告欄／後台／個人／通知）。

## Risks / Trade-offs

- [`matchNote` 自由文字] → 後端 trim + 長度上限（500）；前端顯示時保留換行、避免 XSS（React 預設轉義）。
- [關閉公開後 matchNote 去留] → 保留草稿、僅布告欄不顯示；降低再次開啟的重填成本。
- [布告欄資料量成長] → 首版單頁；未來再加分頁／篩選（Non-Goal）。
- [卡片新增 prop] → 採選填 prop，不影響既有使用點。

## Migration Plan

1. `course-invite.prisma`：`CourseInvite` 新增 `isPublicMatch`、`matchNote`。
2. migration `add_course_public_match`（`ALTER TABLE "course_invites" ADD COLUMN "isPublicMatch" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "matchNote" TEXT;`）+ `prisma generate`。
3. 實作 schema/action/精靈/詳情頁/布告欄/Topbar。
4. **Rollback**：還原 migration（drop 兩欄）+ 還原程式碼。

## Open Questions

（皆已確認）

- ✅ 布告欄 SHALL 因 `expiredAt` 過期而隱藏課程（見 Decision 2）。
- ✅ 卡片 SHALL 顯示「公開媒合／招募中」badge（見 Decision 4）。
- ✅ 關閉公開媒合時**保留** `matchNote` 不清空（見 Decision 3）。



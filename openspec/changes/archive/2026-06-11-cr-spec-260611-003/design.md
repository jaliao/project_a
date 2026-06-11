## Context

後台開課管理 `/admin/course-sessions`（Server Component）以 `getAllCourseSessionsAdmin` 取得前 30 筆，渲染為 `CourseSessionCard`（整張卡片為連結，`newTab` 另開課程詳情頁）。課程狀態由 `CourseInvite` 的 `startedAt`/`cancelledAt`/`completedAt` 三旗標推導：

- 已取消：`cancelledAt != null`（最高優先）
- 已結業：`completedAt != null`
- 進行中：`startedAt != null`
- 招生中：三者皆 null

現有狀態變更 action（`startCourseSession`/`cancelCourseSession`/`graduateCourse`）僅允許開課者本人，管理者無法操作。

## Goals / Non-Goals

**Goals:**
- 管理者可在後台列表每筆課程以 inline 下拉直接變更狀態。
- 目標狀態限 招生中／進行中／已取消，自由任意轉換（含回退）。
- 以管理者權限（`canAccessAdmin`）授權，獨立於開課者本人限制。

**Non-Goals:**
- 不提供後台設「已結業」（結業仍由講師走 `/course/[id]/graduate`）。
- 不連動處理 `InviteEnrollment.graduatedAt`（學員結業證書）。
- 不變更既有狀態篩選功能（已存在）。
- 不變更講師端既有 action 與其通知行為。
- 無 DB schema 變更。

## Decisions

### 1. 新增管理者專用 action `setCourseStatusAdmin`
位置 `app/actions/course-session.ts`，簽章 `setCourseStatusAdmin(inviteId: number, target: 'recruiting' | 'started' | 'cancelled')`。

- 授權：`auth()` + `canAccessAdmin(roles)`，否則回 `無權限`。
- 拒絕 `target === 'completed'`（後台不提供）。
- 旗標對應：
  - `recruiting` → `{ startedAt: null, cancelledAt: null, completedAt: null, cancelReason: null }`
  - `started` → `{ startedAt: now, cancelledAt: null, completedAt: null, cancelReason: null }`
  - `cancelled` → `{ cancelledAt: now, cancelReason: '（管理者後台調整）' }`
- `revalidatePath('/admin/course-sessions')` 與 `revalidatePath('/course/${inviteId}')`。
- **不**呼叫 `createNotification`（行政更正，不打擾講師／學員）。

### 2. UI：每筆卡片下方獨立下拉，而非卡片內
`CourseSessionCard` 整張是連結，若把下拉放進卡片會與導航點擊衝突。改為在每個 grid cell 內、卡片**下方**渲染獨立 client 元件 `CourseStatusSelect`：

```
<div key={item.id} className="space-y-2">
  <CourseSessionCard ... />
  <CourseStatusSelect inviteId={item.id} current={deriveStatus(item)} />
</div>
```

`CourseStatusSelect`（client）：
- props：`inviteId`、`current`（由旗標推導的四狀態之一）。
- 下拉選項：招生中／進行中／已取消；「已結業」僅在 `current === 'completed'` 時作為**停用**的當前顯示項出現，不可被選取。
- `onChange` → 呼叫 `setCourseStatusAdmin` → `sonner` toast 顯示結果 → `router.refresh()` 更新列表。
- 變更中以 disabled 防重複提交。

### 3. 狀態推導 helper
列表項已含三旗標，於頁面以小工具函式推導 `current`（cancelled > completed > started > recruiting），傳入下拉。

## Risks / Trade-offs

- **自由任意轉換的資料不一致**（使用者已知並接受）：將「已結業」課程改回招生中／進行中會清掉 `completedAt`，但**不**清除學員 `graduatedAt`，造成「課程非結業、學員仍持證」的不一致。屬刻意取捨；如日後需嚴謹可加結業回退處理。
- **無通知**：講師／學員不會被告知後台調整，符合「行政更正」定位；若未來需通知可再加。
- **取消原因固定文字**：後台 inline 取消使用固定 `（管理者後台調整）`，不提供自填（保持 inline 操作簡潔）。

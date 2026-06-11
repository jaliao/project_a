## Why

目前課程狀態（招生中／進行中／已結業／已取消）只能由**開課者本人**在課程詳情頁變更（`cancelCourseSession`、`startCourseSession` 等 action 僅認 `createdById`，連 admin 都被擋）。當需要行政更正——例如誤開課、誤取消、講師離開後需接手、狀態卡住——管理者在後台缺乏直接調整的手段。

> 註：需求「在課程管理可以用狀態篩選課程」**已實作**（`/admin/course-sessions` 的「進度」下拉：全部進度／招生中／進行中／已結業／已取消，串 `?status=` → `getAllCourseSessionsAdmin`），本變更不再重做，僅補充本次新增的狀態變更功能。

## What Changes

- 後台開課管理頁 `/admin/course-sessions` 每筆課程新增 **inline 狀態下拉選單**，管理者可直接變更課程狀態。
- 可選目標狀態：**招生中 / 進行中 / 已取消**，採**自由任意轉換**（含回退，例如 已取消 → 招生中、進行中 → 招生中）。
- **不提供**將狀態設為「已結業」：結業仍須由講師走 `/course/[id]/graduate` 逐學員處理，以免影響學員結業證書。已結業課程在下拉中以唯讀／停用顯示「已結業」當前狀態。
- 新增管理者專用 Server Action `setCourseStatusAdmin(inviteId, target)`，以 `canAccessAdmin` 權威守衛；依目標狀態設定／清除 `startedAt`、`cancelledAt`、`completedAt` 旗標。
- 管理者後台變更狀態**不發送 Inbox / toast 通知給講師或學員**（屬行政更正，與既有講師流程的通知行為區隔）。

## Capabilities

### New Capabilities
<!-- 無新增能力 -->

### Modified Capabilities
- `admin-course-sessions`：新增「課程狀態變更（後台）」需求——管理者可於開課管理列表每筆課程以 inline 下拉變更狀態（招生中／進行中／已取消，自由轉換；不提供已結業）。既有「下拉篩選」之進度篩選需求維持不變。

## Impact

- **Server Action** `app/actions/course-session.ts`：新增 `setCourseStatusAdmin`（`canAccessAdmin` 守衛；`recruiting` → 清空三旗標、`started` → `startedAt=now` 並清 cancelled/completed、`cancelled` → `cancelledAt=now`；`revalidatePath('/admin/course-sessions')` 與 `/course/{id}`）。
- **資料層** `lib/data/course-sessions.ts`：確認 `getAllCourseSessionsAdmin` 回傳含 `id` 與 `startedAt`/`cancelledAt`/`completedAt`（或衍生 status）供下拉預選，必要時補欄位。
- **頁面／元件** `app/(user)/admin/course-sessions/`：新增 client 狀態下拉元件（每筆一個），不影響既有「點擊另開視窗」行為。
- **無** DB schema 變更（沿用 `CourseInvite` 既有旗標）。
- **取捨**：自由任意轉換可能造成資料不一致（使用者已知並接受）；本次**不**連動處理 `InviteEnrollment.graduatedAt`，將已結業課程改回其他狀態時學員結業證書保留不動（詳見 design）。
- 依專案規範：完成後 `config/version.json` patch +1、重產 `README-AI.md`、更新 `doc/管理者操作手冊.md`〈開課管理〉章節（新增狀態變更說明）。

## Why

開課卡片目前只能查看摘要資訊，教師無法進入課程詳情頁確認授課資訊與學員名單；也缺少取消課程的操作入口。需補全課程詳情頁及取消課程流程，讓教師能完整管理開課。

## What Changes

- 課程卡片（`CourseSessionCard`）點擊可導向課程詳情頁 `/course/[id]`
- 課程詳情頁顯示：授課老師、已接受邀請的學員名單（InviteEnrollment 列表）
- 頁面底部提供「結業申請」按鈕與「取消課程」按鈕
- 「取消課程」點擊後彈出確認 Dialog，需填寫取消原因
  - 取消原因以下拉選單提供：人數不足、時間因素
  - 或選擇「其他」自行填寫（textarea）
  - 取消原因以文字存入資料庫
- `CourseInvite` 新增 `cancelledAt`（DateTime?）與 `cancelReason`（String?）欄位

## Capabilities

### New Capabilities
- `course-session-detail`: 課程詳情頁 `/course/[id]`，顯示授課老師、已接受學員名單、結業申請與取消課程操作
- `cancel-course-session`: 取消課程流程，含確認 Dialog、取消原因下拉選單（人數不足、時間因素、其他＋自填），並將原因存入 CourseInvite.cancelReason

### Modified Capabilities
- `course-session-card`: 卡片新增點擊連結，導向 `/course/[id]`

## Impact

- 新增路由：`app/(user)/course/[id]/page.tsx`
- 新增元件：`components/course-session/course-session-detail.tsx`、`components/course-session/cancel-course-dialog.tsx`
- 新增 Server Action：`app/actions/course-invite.ts`（cancelCourseSession）
- 修改：`components/course-session/course-session-card.tsx`（加入 `href` 連結）
- 修改：`prisma/schema/course-invite.prisma`（新增 `cancelledAt`、`cancelReason` 欄位）
- 修改：`lib/data/course-sessions.ts`（新增 getCourseSessionById，含 createdBy 與 enrollments）

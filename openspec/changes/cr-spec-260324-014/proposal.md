## Why

cr-spec-260324-013 實作後，後續修正與調整（小寫 URL、個人功能單元搬移、learningLevel schema）尚未反映至 spec。此外新增「我的開課」頁面，將開課列表整合至學員個人路由下，取代原獨立的 `/course-sessions`。

## What Changes

- Spirit ID URL 改為全小寫（`/user/pa260001`），DB 查詢時自動轉大寫
- `/user/{spiritId}` 新增三個「本人專屬」區塊：
  - ProfileBanner（資料完整度提醒，僅本人可見）
  - 授課單元（新增開課、「我的開課」連結，僅本人可見）
  - 管理者單元（導向 /admin，本人且為 admin/superadmin 才顯示）
- 新增 `/user/{spiritId}/courses` — 學員本人的開課列表頁（取代 `/course-sessions`）
- 授課單元的「開課查詢」連結改為 `/user/{spiritId}/courses`
- `/admin` 移除 ProfileBanner、授課單元、管理者單元
- `User` 模型新增 `learningLevel Int @default(0)` 欄位
- 登入後 redirect 若 spiritId 為 null 改導向 `/profile`

## Capabilities

### New Capabilities
- `user-courses`: `/user/{spiritId}/courses` 頁面，列出本人所建立的所有開課（CourseInvite）

### Modified Capabilities
- `student-profile-page`: URL 改小寫；新增本人專屬的 ProfileBanner、授課單元（含 /courses 連結）、管理者單元
- `dashboard-home`: 登入後 spiritId null 時導向 `/profile`；/admin 移除個人功能單元

## Impact

- 新增路由：`app/(user)/user/[spiritId]/courses/page.tsx`
- `app/(user)/user/[id]/page.tsx` — URL 查詢邏輯、新增三個條件區塊、授課單元連結更新
- `app/(user)/admin/page.tsx` — 移除個人相關區塊
- `app/page.tsx`、`app/(user)/dashboard/page.tsx` — redirect 邏輯
- `prisma/schema/user.prisma` — 新增 learningLevel 欄位
- `lib/data/course-sessions.ts` — 現有查詢函式供 /courses 頁面複用

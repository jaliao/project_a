## Why

現有管理後台首頁混雜了統計卡片、開課預覽、學員列表等內容，缺乏清晰的功能導覽入口。需重新設計為以功能按鈕為主的導覽頁，讓管理者快速進入各功能模組。

## What Changes

- 移除現有首頁所有內容（StatsCard、RecentMembers、EnrolledStudentsList、CourseSessionCard 預覽、DashboardActions）
- 以功能按鈕網格取代，包含以下入口：
  - **儀錶板**（待開發，disabled 狀態）
  - **課程管理**（已完成，連結 `/admin/course-catalog`）
  - **授課管理**（連結 `/course-sessions`）
  - **教材作業**（連結 `/admin/materials`）
  - **會員管理**（連結 `/admin/members`，含重設密碼功能）
- 新增 `/admin/members` 頁面：列出會員清單，管理者可對指定會員重設密碼（寄送臨時密碼）

## Capabilities

### New Capabilities
- `admin-member-management`：後台會員管理頁，列出會員並支援管理者重設密碼

### Modified Capabilities
- `admin-seed`：後台首頁改版為功能按鈕導覽頁（現有版面全數移除）

## Impact

- `app/(user)/admin/page.tsx`：完整重寫，移除所有舊內容，改為功能按鈕網格
- `app/(user)/admin/members/page.tsx`：新增，會員列表 + 重設密碼
- `app/actions/admin.ts`：新增 `resetMemberPassword()` server action
- 舊有 components（StatsCard、RecentMembers 等）在此頁不再使用（不刪除，其他地方可能沿用）

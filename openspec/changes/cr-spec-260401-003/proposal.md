## Why

現有 `/admin/members` 頁面僅顯示基本會員清單與重設密碼功能。管理者需要更完整的工具：依姓名/暱稱/Email 搜尋會員、查看個別會員的學習與授課紀錄，以及在必要時刪除會員資料。

## What Changes

- **搜尋功能**：`/admin/members` 清單頁加入搜尋列，支援姓名（realName/name）、暱稱（nickname）、Email 篩選
- **會員詳情頁**：新增 `/admin/members/[id]` 頁，顯示：
  - 基本資料（姓名、暱稱、Email、靈人編號、角色、加入日期）
  - 學習紀錄（來自 `InviteEnrollment`，僅顯示 `CourseInvite.startedAt IS NOT NULL` 的場次，即已開始上課的課程）
  - 授課紀錄（來自 `CourseInvite.createdById = 該會員`，同樣僅顯示 `startedAt IS NOT NULL`）
- **刪除功能**：由環境變數 `ENABLE_MEMBER_DELETE=true` 控制顯示，預設關閉；刪除時需二次確認

## Capabilities

### New Capabilities
- `admin-member-management`：擴充後台會員管理，新增搜尋、詳情頁（學習/授課紀錄）、條件式刪除

### Modified Capabilities
（無）

## Impact

- `app/(user)/admin/members/page.tsx`：加入搜尋 UI 與 URL search params 篩選邏輯
- `app/(user)/admin/members/[id]/page.tsx`：新增會員詳情頁
- `app/actions/admin.ts`：新增 `deleteMember(userId)` server action
- `.env.example`：新增 `ENABLE_MEMBER_DELETE` 環境變數說明

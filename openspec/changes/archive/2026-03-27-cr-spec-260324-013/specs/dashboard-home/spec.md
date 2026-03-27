## MODIFIED Requirements

### Requirement: 登入後首頁路由
系統 SHALL 在使用者成功登入且無指定 `callbackUrl` 時，導向 `/user/{currentUserId}`。`/dashboard` 路由 SHALL 保留但執行 server-side redirect 至 `/user/{currentUserId}`，避免舊書籤失效。

#### Scenario: 已登入使用者直接存取 /dashboard
- **WHEN** 已登入使用者存取 `/dashboard`
- **THEN** 系統重定向至 `/user/{currentUserId}`

#### Scenario: 未登入使用者存取 /dashboard
- **WHEN** 未登入使用者存取 `/dashboard`
- **THEN** 系統重定向至 `/login?callbackUrl=/dashboard`

#### Scenario: 登入後預設導向
- **WHEN** 使用者成功登入且無指定 `callbackUrl`
- **THEN** 系統導向 `/user/{currentUserId}`

### Requirement: 根路徑重定向
系統 SHALL 在 `app/page.tsx` 處理根路徑 `/`：未登入由 middleware 攔截導向 `/login`；已登入執行 server-side redirect 至 `/user/{currentUserId}`。

#### Scenario: 已登入使用者存取根路徑
- **WHEN** 已登入使用者存取 `/`
- **THEN** 系統重定向至 `/user/{currentUserId}`

#### Scenario: 未登入使用者存取根路徑
- **WHEN** 未登入使用者存取 `/`
- **THEN** middleware 攔截並重定向至 `/login?callbackUrl=/`

## ADDED Requirements

### Requirement: 管理後台路由
系統 SHALL 提供 `/admin` 路由，顯示原 `/dashboard` 的管理功能，包含統計卡片、近期活動列表、已接受邀請學員列表及開課相關操作。

#### Scenario: 管理員存取 /admin
- **WHEN** 已登入使用者（任何角色）存取 `/admin`
- **THEN** 系統顯示統計卡片（會員總數、本月新增、有 Spirit ID 數）、近期活動、已接受邀請學員列表

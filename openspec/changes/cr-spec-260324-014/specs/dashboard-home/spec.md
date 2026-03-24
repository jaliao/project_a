## MODIFIED Requirements

### Requirement: 登入後首頁路由
系統 SHALL 在使用者成功登入且無指定 `callbackUrl` 時，依 spiritId 是否存在決定導向目標：spiritId 已核發則導向 `/user/{spiritId}`（小寫）；spiritId 尚未核發則導向 `/profile`。

#### Scenario: 已登入且已有 spiritId 的使用者存取 /dashboard
- **WHEN** 已登入使用者存取 `/dashboard`
- **THEN** 系統重定向至 `/user/{spiritId}`（小寫）

#### Scenario: 已登入但 spiritId 為 null 的使用者存取 /dashboard
- **WHEN** 已登入但尚未核發 spiritId 的使用者存取 `/dashboard`
- **THEN** 系統重定向至 `/profile`

#### Scenario: 未登入使用者存取 /dashboard
- **WHEN** 未登入使用者存取 `/dashboard`
- **THEN** 系統重定向至 `/login?callbackUrl=/dashboard`

#### Scenario: 登入後預設導向（有 spiritId）
- **WHEN** spiritId 已核發的使用者成功登入且無指定 `callbackUrl`
- **THEN** 系統導向 `/user/{spiritId}`（小寫）

#### Scenario: 登入後預設導向（無 spiritId）
- **WHEN** spiritId 尚未核發的使用者成功登入
- **THEN** 系統導向 `/profile`

## MODIFIED Requirements

### Requirement: 管理後台路由
系統 SHALL 提供 `/admin` 路由，顯示管理統計功能：統計卡片、已新增開課預覽、已接受邀請學員列表、近期活動。`/admin` 頁面 SHALL NOT 顯示 ProfileBanner、授課單元或管理者單元（此三者已移至 `/user/{spiritId}`）。

#### Scenario: 管理員存取 /admin
- **WHEN** 已登入使用者存取 `/admin`
- **THEN** 系統顯示統計卡片（會員總數、本月新增、有 Spirit ID 數）、已新增開課、已接受邀請學員列表、近期活動；不顯示 ProfileBanner、授課單元、管理者單元

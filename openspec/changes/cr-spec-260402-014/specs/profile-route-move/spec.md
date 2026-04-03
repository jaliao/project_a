## ADDED Requirements

### Requirement: 個人資料頁路由遷移至 /user/[spiritId]/profile
個人資料頁 SHALL 位於 `/user/{spiritId}/profile`，與學員頁面路由結構一致。

#### Scenario: 使用者存取個人資料頁
- **WHEN** 使用者導向 `/user/{spiritId}/profile`
- **THEN** 顯示個人資料表單頁面（與原 `/profile` 內容相同）

#### Scenario: 使用者存取舊路由 /profile
- **WHEN** 使用者導向舊路由 `/profile`
- **THEN** Server redirect 至 `/user/{spiritId}/profile`（從 session 取得 spiritId）

### Requirement: Topbar 個人資料按鈕導向新路由
Topbar 的個人資料圖示按鈕 SHALL 導向 `/user/{spiritId}/profile`。

#### Scenario: 點擊 Topbar 個人資料按鈕
- **WHEN** 使用者點擊 Topbar 右側個人資料圖示
- **THEN** 導向 `/user/{spiritId}/profile`

### Requirement: 全站 /profile 連結更新
所有硬編 `/profile` 連結 SHALL 更新為 `/user/{spiritId}/profile`，包含 profile-banner、change-password 頁面、profile-form Google OAuth callbackUrl。

#### Scenario: profile-banner 完善資料連結
- **WHEN** 使用者看到資料完整度提醒 banner
- **THEN** 「完善個人資料」連結導向 `/user/{spiritId}/profile`

#### Scenario: 修改密碼後跳轉
- **WHEN** 使用者在 `/change-password` 成功修改密碼
- **THEN** 導向 `/user/{spiritId}/profile`

#### Scenario: Google 帳號連動 callbackUrl
- **WHEN** 使用者在個人資料頁點擊連結 Google 帳號
- **THEN** OAuth 完成後 callback 回 `/user/{spiritId}/profile`

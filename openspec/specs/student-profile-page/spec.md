# student-profile-page Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for student-profile-page.

## Requirements

### Requirement: 學員專屬頁面路由
系統 SHALL 提供 `/user/{spiritId}` 路由，顯示指定學員的個人資料頁面。路由參數使用 Spirit ID **小寫**形式（例：`pa260001`）；系統在查詢資料庫時 SHALL 自動轉換為大寫。所有已登入使用者皆可存取任意學員頁面。

#### Scenario: 已登入使用者查閱他人頁面
- **WHEN** 已登入使用者存取 `/user/{otherSpiritId}`（小寫）
- **THEN** 系統顯示對應學員的基本資料頁面

#### Scenario: 使用者查閱自己的頁面
- **WHEN** 已登入使用者存取 `/user/{selfSpiritId}`（小寫）
- **THEN** 系統顯示自己的基本資料頁面，並額外顯示本人專屬功能區塊

#### Scenario: 未登入使用者存取
- **WHEN** 未登入使用者存取 `/user/{spiritId}`
- **THEN** 系統重定向至 `/login?callbackUrl=/user/{spiritId}`

#### Scenario: 不存在的 Spirit ID
- **WHEN** 已登入使用者存取不存在的 Spirit ID
- **THEN** 系統顯示 404 頁面

### Requirement: 基本資料區塊 — 學習進度三卡
學員頁面（`/user/{spiritId}`）之基本資料區塊內 SHALL 固定顯示三張課程進度卡，依課程目錄順序：**啟動靈人、啟動豐盛、啟動得勝**（無論有無學習紀錄皆顯示）。已結業之目錄卡片 SHALL 以完成樣式呈現並顯示**學業完成時間**（該目錄最新 `graduatedAt`，格式 `YYYY/MM/DD`）；未結業目錄以未完成樣式（虛線／灰階）呈現。三卡為公開資訊，本人與他人視角 SHALL 一致顯示。頁面 SHALL NOT 再顯示獨立的「結業證明」區塊，他人視角 SHALL NOT 顯示「學習紀錄預覽」區塊。

#### Scenario: 固定顯示三卡
- **WHEN** 任一已登入使用者存取任一學員頁面
- **THEN** 基本資料區塊內依序顯示啟動靈人、啟動豐盛、啟動得勝三張卡片

#### Scenario: 已結業卡片顯示完成時間
- **WHEN** 學員的「啟動靈人」有結業紀錄（`graduatedAt` 非空）
- **THEN** 該卡片以完成樣式顯示，並顯示學業完成時間

#### Scenario: 同目錄多筆結業取最新
- **WHEN** 學員同一課程目錄有多筆結業紀錄
- **THEN** 卡片顯示最新一筆 `graduatedAt` 作為學業完成時間

#### Scenario: 未結業卡片為未完成樣式
- **WHEN** 學員的「啟動得勝」無結業紀錄
- **THEN** 該卡片以未完成樣式呈現，不顯示完成時間

#### Scenario: 他人視角可見三卡、不見預覽區塊
- **WHEN** 其他會員瀏覽該學員頁面
- **THEN** 可見基本資料區塊內的三張進度卡（含結業時間），頁面不顯示「學習紀錄預覽」與「結業證明」區塊

### Requirement: 本人專屬 — 資料完整度提醒
學員頁面 SHALL 在使用者查閱自己頁面時顯示 ProfileBanner。ProfileBanner 根據 `realName`、通訊 Email、`phone` 是否填寫完整，顯示歡迎訊息或補填提醒。

#### Scenario: 本人且資料已完整
- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}`，且 realName、commEmail（或 email）、phone 均已填寫
- **THEN** 頁面顯示「歡迎回來」歡迎訊息

#### Scenario: 本人且資料未完整
- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}`，且任一必填欄位為空
- **THEN** 頁面顯示資料補填提醒 Banner，含「前往填寫」連結至 `/profile`

#### Scenario: 他人頁面不顯示 Banner
- **WHEN** 已登入使用者存取他人的 `/user/{spiritId}`
- **THEN** 頁面不顯示 ProfileBanner

### Requirement: 本人專屬 — 授課單元
學員頁面 SHALL 在使用者查閱自己頁面時顯示授課單元，包含「新增開課」按鈕與「我的開課」連結。

#### Scenario: 本人頁面顯示授課單元
- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}`
- **THEN** 頁面顯示授課單元，含「新增開課」按鈕（開啟 CourseSessionDialog）與「我的開課」連結（導向 `/user/{spiritId}/courses`）

#### Scenario: 他人頁面不顯示授課單元
- **WHEN** 已登入使用者存取他人的 `/user/{spiritId}`
- **THEN** 頁面不顯示授課單元

### Requirement: 本人專屬 — 管理者單元
學員頁面 SHALL 在使用者查閱自己頁面且角色為 admin 或 superadmin 時，顯示管理者單元，提供導向 `/admin` 的連結。

#### Scenario: 本人且為管理者
- **WHEN** role 為 admin 或 superadmin 的使用者存取自己的 `/user/{spiritId}`
- **THEN** 頁面顯示管理者單元，含「管理後台」連結導向 `/admin`

#### Scenario: 本人但非管理者
- **WHEN** role 為 user 的使用者存取自己的 `/user/{spiritId}`
- **THEN** 頁面不顯示管理者單元

#### Scenario: 他人頁面不顯示管理者單元
- **WHEN** 已登入使用者存取他人的 `/user/{spiritId}`
- **THEN** 頁面不顯示管理者單元

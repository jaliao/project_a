## ADDED Requirements

### Requirement: 資料模型
系統 SHALL 於 `User` 新增 `avatarKey`（可為空），記錄使用者自訂上傳頭像於 R2 的 object key；`avatarKey` 為 `null` 代表使用者未上傳自訂頭像。

#### Scenario: 新帳號預設無自訂頭像
- **WHEN** 新建立一筆 `User` 記錄
- **THEN** `avatarKey` 為 `null`

### Requirement: 上傳頭像
已登入使用者 SHALL 能在個人資料頁上傳自訂頭像圖片。系統 SHALL 驗證檔案類型僅接受 `image/jpeg`、`image/png`、`image/webp`，檔案大小上限 2MB；驗證通過後上傳至 R2（新建之 project_a 專屬 bucket）並更新該使用者的 `avatarKey`。若使用者原本已有自訂頭像，系統 SHALL 於更新成功後刪除舊的 R2 物件。

#### Scenario: 成功上傳頭像
- **WHEN** 已登入使用者於個人資料頁選擇一張 2MB 以內的 jpg/png/webp 圖片上傳
- **THEN** 系統將圖片存至 R2，更新該使用者 `avatarKey`，個人資料頁立即顯示新頭像

#### Scenario: 檔案類型不符被拒
- **WHEN** 使用者上傳非 jpg/png/webp 格式的檔案（如 gif、svg、pdf）
- **THEN** 系統拒絕上傳，顯示檔案類型不符的錯誤提示，不寫入 `avatarKey`

#### Scenario: 檔案超過大小上限被拒
- **WHEN** 使用者上傳超過 2MB 的圖片
- **THEN** 系統拒絕上傳，顯示檔案過大的錯誤提示，不寫入 `avatarKey`

#### Scenario: 更換頭像時刪除舊物件
- **WHEN** 已有自訂頭像的使用者上傳新的頭像圖片並成功
- **THEN** 系統刪除該使用者先前於 R2 的舊頭像物件，僅保留新物件

### Requirement: 移除頭像
已上傳自訂頭像的使用者 SHALL 能在個人資料頁移除頭像，移除後系統 SHALL 清空該使用者 `avatarKey` 並刪除對應的 R2 物件，顯示回退為下一層 fallback（Google 頭像或預設圖示）。

#### Scenario: 成功移除頭像
- **WHEN** 已有自訂頭像的使用者點擊「移除頭像」並確認
- **THEN** 系統清空該使用者 `avatarKey`、刪除對應 R2 物件，頁面改顯示 Google 頭像（若有）或預設圖示

#### Scenario: 未上傳過頭像時無移除入口
- **WHEN** 使用者從未上傳過自訂頭像（`avatarKey` 為 `null`）
- **THEN** 個人資料頁不顯示「移除頭像」按鈕

### Requirement: 頭像顯示三層 Fallback
任何顯示使用者頭像的介面 SHALL 依序套用：①該使用者 `avatarKey` 有值時顯示對應 R2 圖片；②否則若 `image`（Google OAuth 帶入）有值則顯示該圖片；③兩者皆無則顯示預設圖示或姓名縮寫（shadcn `AvatarFallback`）。

#### Scenario: 有自訂頭像時優先顯示
- **WHEN** 使用者 `avatarKey` 與 `image` 皆有值
- **THEN** 介面顯示 `avatarKey` 對應的自訂頭像，非 `image`

#### Scenario: 無自訂頭像但有 Google 頭像
- **WHEN** 使用者 `avatarKey` 為 `null`、`image` 有值
- **THEN** 介面顯示 `image` 對應的 Google 頭像

#### Scenario: 兩者皆無時顯示預設樣式
- **WHEN** 使用者 `avatarKey` 與 `image` 皆為 `null`
- **THEN** 介面顯示預設圖示或姓名縮寫，不顯示破圖

### Requirement: 頭像顯示套用範圍
系統 SHALL 於下列四處套用頭像顯示三層 Fallback：個人資料頁（`/profile`、`/user/[spiritId]/profile`）本人頭像管理區塊；學員專屬頁面（`/user/{spiritId}`）基本資料區塊；Topbar 個人資料按鈕；站內訊息對話串各則訊息之寄件者頭像。

#### Scenario: 學員專屬頁面顯示頭像
- **WHEN** 已登入使用者造訪任一學員的 `/user/{spiritId}`
- **THEN** 基本資料區塊顯示該學員的頭像（依三層 Fallback 規則）

#### Scenario: Topbar 顯示本人頭像
- **WHEN** 已登入使用者檢視 Topbar
- **THEN** 原本的個人資料圖示按鈕改顯示本人頭像（依三層 Fallback 規則）

#### Scenario: 站內訊息顯示寄件者頭像
- **WHEN** 已登入使用者檢視任一對話串的訊息記錄
- **THEN** 每則訊息旁顯示該則訊息寄件者的頭像（依三層 Fallback 規則），不再是固定的預設圖示

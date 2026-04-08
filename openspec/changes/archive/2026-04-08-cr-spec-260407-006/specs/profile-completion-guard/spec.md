## ADDED Requirements

### Requirement: 環境變數控制強制轉導行為
系統 SHALL 透過 `REQUIRE_PROFILE_COMPLETION` 環境變數（預設 `true`）決定未填資料時的處理策略。

#### Scenario: 環境變數未設定時視為啟用
- **WHEN** `REQUIRE_PROFILE_COMPLETION` 未設定或值為非 `'false'` 字串
- **THEN** 系統採用強制轉導模式

#### Scenario: 環境變數設為 false 時停用強制轉導
- **WHEN** `REQUIRE_PROFILE_COMPLETION=false`
- **THEN** 系統不執行任何轉導，保留橘色警告訊息的原有行為

### Requirement: 強制轉導未填資料的會員
當強制轉導模式啟用時，`(user)` layout SHALL 在每次請求時檢查已登入會員的 `realName` 與 `phone` 欄位，若任一欄位缺失則導向 Profile 頁。

#### Scenario: realName 未填時被導向 Profile
- **WHEN** 強制轉導模式啟用，且已登入會員的 `realName` 為 null 或空字串
- **THEN** 系統導向 `/user/[spiritId]/profile?incomplete=1`

#### Scenario: phone 未填時被導向 Profile
- **WHEN** 強制轉導模式啟用，且已登入會員的 `phone` 為 null 或空字串
- **THEN** 系統導向 `/user/[spiritId]/profile?incomplete=1`

#### Scenario: 資料完整時正常放行
- **WHEN** 強制轉導模式啟用，且 `realName` 與 `phone` 均已填寫
- **THEN** 系統正常渲染頁面，不執行轉導

### Requirement: Profile 路由排除在轉導之外
系統 SHALL 不對 Profile 頁面本身執行轉導，以防止無限迴圈。

#### Scenario: 存取 Profile 頁時不觸發轉導
- **WHEN** 強制轉導模式啟用，且使用者目前路徑包含 `/profile`
- **THEN** 系統不執行轉導，正常顯示 Profile 頁面

### Requirement: Profile 頁顯示資料未完整提示
Profile 頁面 SHALL 偵測 `?incomplete=1` query param，若存在則顯示強調提示訊息。

#### Scenario: 帶 incomplete=1 進入 Profile 頁
- **WHEN** 使用者被導向 `/user/[spiritId]/profile?incomplete=1`
- **THEN** 頁面顯示「請先填寫必要資料，才能繼續使用系統」提示，優先於原有橘色警告框

#### Scenario: 直接進入 Profile 頁（無 incomplete param）
- **WHEN** 使用者直接開啟 Profile 頁，無 `incomplete=1`
- **THEN** 頁面維持原有橘色警告框行為

### Requirement: spiritId 未設定時不執行轉導
系統 SHALL 在 `spiritId` 為 null 時跳過強制轉導，避免產生無效 URL。

#### Scenario: spiritId 為 null 時不轉導
- **WHEN** 強制轉導模式啟用，且會員 `spiritId` 尚未核發
- **THEN** 系統不執行轉導，正常渲染頁面（依賴原有警告訊息）

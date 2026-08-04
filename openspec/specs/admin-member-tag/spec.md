# admin-member-tag Specification

## Purpose
TBD - created by archiving change cr-spec-260804-001. Update Purpose after archive.
## Requirements
### Requirement: 會員標籤顯示內容
系統 SHALL 提供後台專用的「會員標籤」元件，顯示指定會員的：啟動編號（`spiritId`）、身分標籤（依 `identity-tags` 既有計算邏輯，系統管理員／各書籍講師身分，可同時多個，無任何標籤時顯示「—」）、頭像（依既有三層 fallback：自訂頭像／Google 頭像／預設圖示）、顯示名稱（依既有規則：暱稱優先，模式為 `nickname_zh`/`nickname_en` 時於括號內附註中文/英文名稱）。

#### Scenario: 顯示完整會員資訊
- **WHEN** 後台頁面渲染某會員的會員標籤，且該會員有啟動編號與至少一個身分標籤
- **THEN** 會員標籤顯示啟動編號、身分標籤（一個以上）、頭像、顯示名稱

#### Scenario: 無身分標籤時顯示佔位符
- **WHEN** 會員無任何身分標籤（非管理員且無任何書籍講師身分）
- **THEN** 身分標籤區塊顯示「—」

### Requirement: 會員標籤操作按鈕
會員標籤 SHALL 提供「檢視」與「訊息」兩個圖示按鈕。「檢視」點擊後 SHALL 於新分頁開啟 `/admin/members/{該會員 id}`；「訊息」點擊後 SHALL 開啟既有訊息 Drawer 並直接開啟/建立與該會員的對話。

#### Scenario: 點擊檢視按鈕
- **WHEN** 管理者點擊會員標籤的「檢視」按鈕
- **THEN** 新分頁開啟該會員的後台會員詳情頁 `/admin/members/{id}`，原分頁不受影響

#### Scenario: 點擊訊息按鈕
- **WHEN** 管理者點擊會員標籤的「訊息」按鈕
- **THEN** 訊息 Drawer 開啟並直接顯示（或建立）與該會員的對話，可直接輸入訊息

### Requirement: 會員文字元件
系統 SHALL 提供後台專用的「會員文字元件」，以底線文字呈現指定會員的啟動編號與顯示名稱（格式：`{啟動編號} {顯示名稱}`）；點擊該文字後 SHALL 以 Popover 彈出完整「會員標籤」（見「會員標籤顯示內容」「會員標籤操作按鈕」需求），提供檢視與傳訊息入口。

#### Scenario: 顯示底線文字
- **WHEN** 後台頁面渲染某會員的會員文字元件
- **THEN** 顯示該會員「啟動編號＋顯示名稱」的底線文字

#### Scenario: 點擊展開完整會員標籤
- **WHEN** 管理者點擊會員文字元件
- **THEN** 以 Popover 彈出該會員的完整會員標籤，可於其中點擊「檢視」或「訊息」


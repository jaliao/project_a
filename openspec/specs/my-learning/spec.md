# my-learning Specification

## Purpose
TBD - created by archiving change cr-spec-260828-003. Update Purpose after archive.
## Requirements
### Requirement: 我的學習頁面路由與存取

系統 SHALL 提供 `/user/{spiritId}/learning`（書籍選擇）與 `/user/{spiritId}/learning/{catalogId}`（單一課程目錄）兩層路由，顯示該學員的「我的學習」分段查經筆記。兩層皆 SHALL 僅本人可存取：已登入使用者存取他人的對應路由 SHALL 被重定向至本人的對應路由；未登入使用者存取 SHALL 被重定向至 `/login`。`/user/{spiritId}/learning` SHALL 提供返回 `/user/{spiritId}` 的連結；`/user/{spiritId}/learning/{catalogId}` SHALL 提供返回 `/user/{spiritId}/learning` 的連結。`{catalogId}` 若非合法數字、對應 `CourseCatalog` 不存在、或設定檔中無該目錄之大綱，系統 SHALL 重定向至 `/user/{spiritId}/learning`。此頁面內容 SHALL NOT 對他人或管理者後台可見。

#### Scenario: 本人存取書籍選擇頁

- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}/learning`
- **THEN** 系統顯示三張書籍卡片（啟動靈人／啟動豐盛／啟動得勝）

#### Scenario: 本人存取書籍子頁

- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}/learning/{catalogId}`，且該目錄合法且有大綱
- **THEN** 系統顯示該目錄的課次卡片牆

#### Scenario: 存取他人頁面

- **WHEN** 已登入使用者存取他人的 `/user/{otherSpiritId}/learning` 或 `/user/{otherSpiritId}/learning/{catalogId}`
- **THEN** 系統重定向至本人的對應路由

#### Scenario: 未登入存取

- **WHEN** 未登入使用者存取 `/user/{spiritId}/learning` 或其子頁
- **THEN** 系統重定向至 `/login`

#### Scenario: 非法的 catalogId

- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}/learning/{catalogId}`，但 `{catalogId}` 非數字、無對應 `CourseCatalog`、或設定檔無該目錄大綱
- **THEN** 系統重定向至 `/user/{spiritId}/learning`

### Requirement: 首頁「我的學習」入口

`/user/{spiritId}` 首頁 SHALL 在使用者查閱自己頁面時顯示「我的學習」單元，其標題列 SHALL 連結至 `/user/{spiritId}/learning`。他人視角 SHALL NOT 顯示此單元。

#### Scenario: 本人首頁顯示入口

- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}`
- **THEN** 頁面顯示「我的學習」單元，點擊導向 `/user/{spiritId}/learning`

#### Scenario: 他人首頁不顯示入口

- **WHEN** 已登入使用者存取他人的 `/user/{spiritId}`
- **THEN** 頁面不顯示「我的學習」單元

### Requirement: 課程目錄解鎖條件

「我的學習」的書籍子頁 SHALL 僅在該課程目錄「已解鎖」時允許檢視與撰寫分段查經。某課程目錄對某使用者 SHALL 視為已解鎖，當且僅當該使用者在該 `courseCatalogId` 下存在任一報名，其 `status` 為 `approved`、未取消，且所屬開課的 `startedAt` 已設定（`completedAt` 已設定者亦成立）。解鎖判定 SHALL 為即時計算，SHALL NOT 因課程結業或取消單一開課而失效（只要仍存在符合條件的其他報名）。書籍選擇頁的三張書籍卡片 SHALL 皆顯示；未解鎖者 SHALL 以鎖定樣式呈現並提示「尚未開課」，設定檔尚無大綱者 SHALL 以鎖定樣式呈現並提示「尚未開放」；兩者皆 SHALL NOT 連入子頁。已解鎖且設定檔有大綱者 SHALL 可連入子頁。已解鎖但存取子頁時，若目錄無大綱亦比照「非法的 catalogId」重定向。「我的學習」筆記 SHALL NOT 綁定任一特定 `CourseInvite` 或報名。

#### Scenario: 已解鎖且有大綱的書籍卡片可進入

- **WHEN** 使用者在「啟動豐盛」目錄有一筆 `approved`、未取消、所屬開課 `startedAt` 非空的報名，且設定檔已有啟動豐盛大綱
- **THEN** 書籍選擇頁的「啟動豐盛」卡片為可點擊狀態，點擊導向 `/user/{spiritId}/learning/2`

#### Scenario: 有大綱但未解鎖 → 顯示「尚未開課」

- **WHEN** 設定檔已有啟動豐盛大綱，但使用者在啟動豐盛無任何已開始的報名
- **THEN** 「啟動豐盛」書籍卡片以鎖定樣式顯示「尚未開課」、不可點擊

#### Scenario: 尚無大綱的書籍卡片鎖定

- **WHEN** 某書籍（如啟動得勝）在設定檔中尚無課次大綱
- **THEN** 該書籍卡片以鎖定樣式顯示「尚未開放」、不可點擊

#### Scenario: 直接存取未解鎖子頁

- **WHEN** 使用者直接存取自己 `/user/{spiritId}/learning/{catalogId}`，該目錄合法且有大綱但使用者未解鎖
- **THEN** 頁面顯示鎖定訊息與返回連結，不顯示課次卡片、不可撰寫筆記

#### Scenario: 結業後仍可使用

- **WHEN** 使用者在某目錄的報名所屬開課已結業（`completedAt` 非空、`startedAt` 非空）
- **THEN** 該目錄仍為已解鎖，使用者仍可進入子頁新增與編輯筆記

### Requirement: 課程大綱結構

課程大綱（課程目錄 → 課次 → 經文項目）SHALL 由程式碼設定檔 `config/learning-outline.ts` 定義，作為單一事實來源。每個課次 SHALL 具備穩定識別 `lessonKey`、顯示標題與經文項目清單；每個經文項目 SHALL 具備穩定識別 `scriptureKey` 與顯示標籤。`lessonKey` 與 `scriptureKey` 一經發布 SHALL 視為不可變（筆記以 `courseCatalogId` + `lessonKey` + `scriptureKey` 三元組參照）；顯示文字（`title` / `label`）可調整。

「啟動靈人」（`courseCatalogId = 1`）之大綱 SHALL 包含十二課，`lessonKey` 為 `lesson-01` ~ `lesson-12`，其中 `lesson-01`（第一課：接受禮物）與 `lesson-12`（第十二課：靈人全開啟）無經文項目，其餘十課各含三個經文項目。既有 `lesson-01`／`lesson-02` 之 `key` SHALL 保留不變。

「啟動豐盛」（`courseCatalogId = 2`）之大綱 SHALL 包含十二課，`lessonKey` 為 `lesson-01` ~ `lesson-12`，其中 `lesson-01`（第一課：開啟祝福的第一步 孝敬父母）無經文項目，其餘十一課各含三個經文項目（依需求單 CR-SPEC-260828-012 所列書卷章次；經文顯示名稱採聖經和合本正式書名，如「創世記」）。

「啟動得勝」（`courseCatalogId = 3`）之大綱 MAY 為空，待日後於設定檔追加。

#### Scenario: 顯示啟動靈人十二課

- **WHEN** 使用者的「啟動靈人」已解鎖並開啟其書籍子頁
- **THEN** 頁面依序顯示第一課至第十二課的課次卡片，標題為「第 N 課：<標題>」

#### Scenario: 顯示啟動豐盛十二課

- **WHEN** 使用者的「啟動豐盛」已解鎖並開啟其書籍子頁
- **THEN** 頁面依序顯示第一課至第十二課的課次卡片；第一課無經文項目、標「無需填寫」，其餘十一課各顯示三個經文項目

#### Scenario: 無經文項目的課次

- **WHEN** 使用者展開一個設定檔中 `scriptures` 為空的課次（如啟動靈人第一課／第十二課、啟動豐盛第一課）
- **THEN** 展開區塊顯示「本課次無分段查經」之提示，不提供任何筆記填寫入口

#### Scenario: 既有筆記不受標題更新影響

- **WHEN** 使用者在改版前已於某 `courseCatalogId` + `lessonKey` + `scriptureKey` 撰寫過筆記
- **THEN** 之後即使該課次／經文的顯示文字調整，這些筆記仍歸屬於同一位置，內容完整

### Requirement: 分段查經筆記欄位與撰寫

每一個經文項目 SHALL 可撰寫「分段查經」筆記，單筆筆記欄位為：總標題（一般文字、單行）、次標題、所領受的話語、運用（後三者為多行純文字，保留換行、不支援格式）。總標題 SHALL 為必填（1–200 字）；次標題／所領受的話語／運用 SHALL 為選填（各上限 5000 字）。同一經文項目 SHALL 允許多筆筆記。每筆筆記 SHALL 記錄建立時間並於頁面顯示；筆記經編輯後 SHALL 記錄更新時間並於頁面標示為「已編輯」。筆記 SHALL 可由本人編輯與刪除，刪除 SHALL 有二次確認。筆記的填寫入口 SHALL 位於書籍子頁中「展開的課次卡片」內。UI 文案 SHALL 以 i18n key 取用，SHALL NOT 於元件寫死中文；驗證訊息 SHALL 置於 `validation.*` key 並以共用 `<FieldError>` 呈現。

#### Scenario: 於展開的課次卡片內新增筆記

- **WHEN** 使用者在書籍子頁點開某課次卡片，於其中一個經文項目填寫總標題（非空）與選填欄位並送出
- **THEN** 系統建立一筆筆記，展開區塊於該經文項目下顯示此筆記與其建立時間

#### Scenario: 總標題未填擋下

- **WHEN** 使用者未填總標題（或僅空白）即送出筆記表單
- **THEN** 系統拒絕建立，於總標題欄位顯示必填錯誤訊息，不寫入資料庫

#### Scenario: 同一項目再寫一筆

- **WHEN** 使用者在已有筆記的經文項目下再次新增筆記
- **THEN** 系統另建一筆獨立筆記，兩筆並存，各自顯示建立時間

#### Scenario: 編輯與刪除

- **WHEN** 使用者編輯自己的一筆筆記並儲存，或對一筆筆記點擊刪除並於二次確認後確認
- **THEN** 編輯後該筆四個內容欄位更新、標示「已編輯」與更新時間；刪除後該筆不再顯示

### Requirement: 筆記操作授權與伺服器端驗證

新增／編輯／刪除筆記 SHALL 由 Server Action 處理，且 SHALL 先驗證登入 session。`createStudyEntry` SHALL 於伺服器端驗證：Zod 欄位、目標 `(courseCatalogId, lessonKey, scriptureKey)` 存在於大綱設定檔且該經文項目非空、且該 `courseCatalogId` 在該使用者的已解鎖集合內；任一不通過 SHALL 拒絕並回傳受控錯誤，不寫入資料。`updateStudyEntry` 與 `deleteStudyEntry` SHALL 驗證目標筆記的 `userId` 等於當前 session 使用者，否則回傳無權限錯誤；此二者 SHALL NOT 因目錄事後未解鎖而拒絕（允許持續維護既有筆記）。所有異動成功後 SHALL 呼叫 `revalidatePath` 更新頁面。伺服器端驗證邏輯 SHALL NOT 因本次 UI 改版而放寬。

#### Scenario: 未解鎖目錄無法新增

- **WHEN** 使用者對一個自己未解鎖的 `courseCatalogId` 呼叫 `createStudyEntry`
- **THEN** 系統回傳受控錯誤，不建立任何筆記

#### Scenario: 大綱路徑不合法無法新增

- **WHEN** `createStudyEntry` 帶入的 `lessonKey`／`scriptureKey` 在設定檔中不存在（或指向無經文項目的課次）
- **THEN** 系統回傳受控錯誤，不建立任何筆記

#### Scenario: 非擁有者不能編輯或刪除

- **WHEN** 使用者對不屬於自己的筆記 id 呼叫 `updateStudyEntry` 或 `deleteStudyEntry`
- **THEN** 系統回傳 `{ success: false, message: '無權限' }`，不異動資料

#### Scenario: 未登入拒絕

- **WHEN** 未登入狀態呼叫任一筆記 Server Action
- **THEN** 系統拒絕操作，不異動資料

### Requirement: 書籍選擇頁與課次卡片牆

`/user/{spiritId}/learning` SHALL 以卡片方式列出所有課程目錄（依 `CourseCatalog.sortOrder`）作為「書籍」入口，卡片牆 SHALL 使用與個人首頁「授課單元」相同的響應式網格容器（`CourseCardGrid`）。`/user/{spiritId}/learning/{catalogId}` SHALL 以同一響應式網格容器列出該目錄大綱中的所有課次作為卡片。課次卡片 SHALL 顯示課次標題與「完成狀態」視覺標記，並可點擊以在**同頁展開／收合（accordion）**該課次的經文項目與分段查經筆記；同一時間 SHALL 至多展開一個課次。書籍子頁 SHALL 於頂部顯示「已完成課次數 / 總課次數」。

#### Scenario: 課次卡片牆為響應式網格

- **WHEN** 使用者在不同寬度的裝置開啟書籍子頁
- **THEN** 課次卡片以與個人首頁授課單元一致的欄數斷點呈現（單欄 → 多欄）

#### Scenario: 點擊課次卡片展開

- **WHEN** 使用者點擊一張課次卡片
- **THEN** 該課次於同頁展開，顯示其經文項目與既有筆記及新增入口；再次點擊或點擊另一張卡片時，原展開的課次收合

#### Scenario: 書籍子頁顯示完成進度

- **WHEN** 使用者開啟「啟動靈人」書籍子頁
- **THEN** 頁面頂部顯示「已完成 X / 共 12 課」

### Requirement: 課次完成狀態配色

課次卡片 SHALL 依「分段查經填寫狀態」以顏色（邊框／標記）區分為兩態並引導使用者填寫：

- 課次**無經文項目**（第一課、第十二課）SHALL 一律視為「完成」，並標示「無需填寫」。
- 課次**有經文項目**且該使用者在該課次（`lessonKey`）下**至少有一筆**分段查經筆記 SHALL 視為「完成」。
- 課次有經文項目且該使用者在該課次下**沒有任何**筆記 SHALL 視為「未完成」，以引導樣式（明顯有別於完成態）呈現。

「已完成課次數」的計算 SHALL 包含所有「完成」態課次（含無經文項目者）。配色 SHALL 使用專案既有的樣式慣例，SHALL NOT 僅以顏色作為唯一區分（須另有文字標記，符合無障礙）。

#### Scenario: 有筆記的課次顯示完成態

- **WHEN** 使用者在「第三課：開啟靈覺（一）」下已有至少一筆分段查經筆記
- **THEN** 該課次卡片以完成態呈現（完成色邊框 ＋ 完成標記）

#### Scenario: 無筆記的課次顯示未完成態

- **WHEN** 使用者在「第四課：開啟靈覺（二）」下沒有任何分段查經筆記
- **THEN** 該課次卡片以未完成／引導態呈現（明顯有別於完成態的樣式 ＋ 文字標記）

#### Scenario: 無經文項目的課次視為完成

- **WHEN** 頁面渲染「第一課：接受禮物」或「第十二課：靈人全開啟」
- **THEN** 該課次卡片以完成態呈現並標示「無需填寫」，且計入「已完成課次數」


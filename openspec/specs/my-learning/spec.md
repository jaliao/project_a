# my-learning Specification

## Purpose
TBD - created by archiving change cr-spec-260828-003. Update Purpose after archive.
## Requirements
### Requirement: 我的學習頁面路由與存取

系統 SHALL 提供 `/user/{spiritId}/learning` 路由，顯示該學員的「我的學習」分段查經筆記。此頁 SHALL 僅本人可存取：已登入使用者存取他人的 `/user/{otherSpiritId}/learning` SHALL 被重定向至本人的 `/user/{selfSpiritId}/learning`；未登入使用者存取 SHALL 被重定向至 `/login`。頁面 SHALL 提供返回 `/user/{spiritId}` 的連結。此頁面內容 SHALL NOT 對他人或管理者後台可見。

#### Scenario: 本人存取

- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}/learning`
- **THEN** 系統顯示該使用者的「我的學習」頁面

#### Scenario: 存取他人頁面

- **WHEN** 已登入使用者存取他人的 `/user/{otherSpiritId}/learning`
- **THEN** 系統重定向至本人的 `/user/{selfSpiritId}/learning`

#### Scenario: 未登入存取

- **WHEN** 未登入使用者存取 `/user/{spiritId}/learning`
- **THEN** 系統重定向至 `/login`

### Requirement: 首頁「我的學習」入口

`/user/{spiritId}` 首頁 SHALL 在使用者查閱自己頁面時顯示「我的學習」單元，其標題列 SHALL 連結至 `/user/{spiritId}/learning`。他人視角 SHALL NOT 顯示此單元。

#### Scenario: 本人首頁顯示入口

- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}`
- **THEN** 頁面顯示「我的學習」單元，點擊導向 `/user/{spiritId}/learning`

#### Scenario: 他人首頁不顯示入口

- **WHEN** 已登入使用者存取他人的 `/user/{spiritId}`
- **THEN** 頁面不顯示「我的學習」單元

### Requirement: 課程目錄解鎖條件

「我的學習」頁面 SHALL 僅渲染「已解鎖」且設定檔中有大綱的課程目錄。某課程目錄對某使用者 SHALL 視為已解鎖，當且僅當該使用者在該 `courseCatalogId` 下存在任一報名，其 `status` 為 `approved`、未取消，且所屬開課的 `startedAt` 已設定（`completedAt` 已設定者亦成立）。解鎖判定 SHALL 為即時計算，SHALL NOT 因課程結業或取消單一開課而失效（只要仍存在符合條件的其他報名）。「我的學習」筆記 SHALL NOT 綁定任一特定 `CourseInvite` 或報名。

#### Scenario: 有已開始的報名即解鎖

- **WHEN** 使用者在「啟動靈人」目錄有一筆 `approved`、未取消、所屬開課 `startedAt` 非空的報名
- **THEN** 「我的學習」頁面顯示「啟動靈人」的大綱與筆記區

#### Scenario: 僅有待審或未開始的報名不解鎖

- **WHEN** 使用者在某目錄的所有報名皆為 `pending`，或所屬開課 `startedAt` 均為空
- **THEN** 「我的學習」頁面不顯示該目錄；若無任何目錄解鎖，顯示「需先開始上課才能使用」空狀態

#### Scenario: 結業後仍可使用

- **WHEN** 使用者在某目錄的報名所屬開課已結業（`completedAt` 非空、`startedAt` 非空）
- **THEN** 該目錄仍為已解鎖，使用者仍可新增與編輯筆記

### Requirement: 課程大綱結構

課程大綱（課程目錄 → 課次 → 經文項目）SHALL 由程式碼設定檔 `config/learning-outline.ts` 定義，作為單一事實來源。每個課次 SHALL 具備穩定識別 `lessonKey`、顯示標題與經文項目清單；每個經文項目 SHALL 具備穩定識別 `scriptureKey` 與顯示標籤。`lessonKey` 與 `scriptureKey` 一經發布 SHALL 視為不可變（筆記以其參照）；顯示文字可調整。本次 SHALL 建置「啟動靈人」（`courseCatalogId = 1`）之大綱：第一課（無經文項目）、第二課「開箱上帝所賜的生命之裡」（經文項目：馬可福音一章、路加福音二章、馬太福音二十七章）。其他課程目錄之大綱 MAY 為空，待日後於設定檔追加。

#### Scenario: 顯示啟動靈人大綱

- **WHEN** 使用者的「啟動靈人」已解鎖並開啟「我的學習」
- **THEN** 頁面依序顯示第一課、第二課；第二課下顯示三個經文項目（馬可福音一章、路加福音二章、馬太福音二十七章）

#### Scenario: 無經文項目的課次

- **WHEN** 頁面渲染「第一課」（設定檔中無經文項目）
- **THEN** 僅顯示課次標題，不提供任何分段查經筆記的填寫入口

#### Scenario: 目錄無大綱

- **WHEN** 使用者某已解鎖目錄在設定檔中無大綱條目（如啟動豐盛尚未建置）
- **THEN** 該目錄不顯示於「我的學習」頁面

### Requirement: 分段查經筆記欄位與撰寫

每一個經文項目 SHALL 可撰寫「分段查經」筆記，單筆筆記欄位為：總標題（一般文字、單行）、次標題、所領受的話語、運用（後三者為多行純文字，保留換行、不支援格式）。總標題 SHALL 為必填（1–200 字）；次標題／所領受的話語／運用 SHALL 為選填（各上限 5000 字）。同一經文項目 SHALL 允許多筆筆記。每筆筆記 SHALL 記錄建立時間並於頁面顯示；筆記經編輯後 SHALL 記錄更新時間並於頁面標示為「已編輯」。筆記 SHALL 可由本人編輯與刪除，刪除 SHALL 有二次確認。UI 文案 SHALL 以 i18n key 取用，SHALL NOT 於元件寫死中文；驗證訊息 SHALL 置於 `validation.*` key 並以共用 `<FieldError>` 呈現。

#### Scenario: 新增一筆筆記

- **WHEN** 使用者在某經文項目下填寫總標題（非空）與選填欄位並送出
- **THEN** 系統建立一筆筆記，頁面於該經文項目下顯示此筆記與其建立時間

#### Scenario: 總標題未填擋下

- **WHEN** 使用者未填總標題（或僅空白）即送出筆記表單
- **THEN** 系統拒絕建立，於總標題欄位顯示必填錯誤訊息，不寫入資料庫

#### Scenario: 同一項目再寫一筆

- **WHEN** 使用者在已有筆記的經文項目下再次新增筆記
- **THEN** 系統另建一筆獨立筆記，兩筆並存，各自顯示建立時間

#### Scenario: 編輯既有筆記

- **WHEN** 使用者編輯自己的一筆筆記並儲存
- **THEN** 系統更新該筆四個內容欄位，頁面標示「已編輯」並顯示更新時間

#### Scenario: 刪除筆記需確認

- **WHEN** 使用者對一筆筆記點擊刪除
- **THEN** 系統先顯示二次確認；確認後刪除該筆，頁面不再顯示

### Requirement: 筆記操作授權與伺服器端驗證

新增／編輯／刪除筆記 SHALL 由 Server Action 處理，且 SHALL 先驗證登入 session。`createStudyEntry` SHALL 於伺服器端驗證：Zod 欄位、目標 `(courseCatalogId, lessonKey, scriptureKey)` 存在於大綱設定檔且該經文項目非空、且該 `courseCatalogId` 在該使用者的已解鎖集合內；任一不通過 SHALL 拒絕並回傳受控錯誤，不寫入資料。`updateStudyEntry` 與 `deleteStudyEntry` SHALL 驗證目標筆記的 `userId` 等於當前 session 使用者，否則回傳無權限錯誤；此二者 SHALL NOT 因目錄事後未解鎖而拒絕（允許持續維護既有筆記）。所有異動成功後 SHALL 呼叫 `revalidatePath` 更新頁面。

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


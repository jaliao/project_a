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

「分段式查經」（原名「我的學習」）入口 SHALL 由 Topbar 提供，而非個人首頁的獨立區塊。Topbar 的操作項目集合 SHALL 包含「分段式查經」（顯示文字以 i18n key `nav.learning` 取用），桌機（水平按鈕列）與手機（收合選單）皆呈現，點擊 SHALL 導向當前登入使用者的 `/user/{spiritId}/learning`。個人首頁（`/user/{spiritId}`）SHALL NOT 顯示獨立的「分段式查經／我的學習」區塊（無論本人或他人視角）。

`/user/{spiritId}/learning` 頁本身、其存取守衛（僅本人）、以及書籍子頁的解鎖與撰寫規則不變。

#### Scenario: Topbar 提供分段式查經入口

- **WHEN** 已登入使用者檢視任一頁面的 Topbar
- **THEN** Topbar 的操作項目（桌機按鈕列與手機選單）包含「分段式查經」，點擊導向 `/user/{spiritId}/learning`（`spiritId` 為當前登入者）

#### Scenario: 個人首頁不再有分段式查經區塊

- **WHEN** 已登入使用者存取自己的 `/user/{spiritId}`
- **THEN** 頁面不顯示獨立的「分段式查經／我的學習」區塊（入口改由 Topbar 提供）

#### Scenario: 他人首頁不顯示分段式查經區塊

- **WHEN** 已登入使用者存取他人的 `/user/{spiritId}`
- **THEN** 頁面不顯示該區塊

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

每一個經文項目 SHALL 對應**至多一筆**「分段查經」筆記（一格一筆）。單筆筆記欄位為：總標題（一般文字、單行）、次標題、所領受的話語、運用（後三者為多行純文字，保留換行、不支援格式）。總標題 SHALL 為必填（1–200 字）；次標題／所領受的話語／運用 SHALL 為選填（各上限 5000 字）。

書籍子頁的課次卡片點開（accordion）後，該課次的每一個經文項目 SHALL 直接呈現一格：**尚無筆記時直接顯示建立表單**（不需再點任何「新增」入口）；**已有筆記時顯示檢視卡**。使用者填寫總標題（非空）與選填欄位並儲存後，該格 SHALL 轉為檢視模式；檢視卡的排版與文字大小 SHALL 比照「聯繫管理者」提問卡片（`InquiryCard`）。三個經文項目的格子 SHALL 以與「聯繫管理者」相同的響應式卡片網格（窄螢幕單欄、寬螢幕三欄）排列。無經文項目的課次（如啟動靈人第一課／第十二課、啟動豐盛第一課）SHALL 顯示「本課次無分段查經」提示，不提供任何填寫入口。

筆記 SHALL 可由本人再次編輯（四個內容欄位），編輯後 SHALL 記錄更新時間並於檢視卡標示為「已編輯」。學員端 SHALL NOT 提供刪除筆記的操作（不顯示刪除按鈕、不提供二次確認刪除流程）。

若同一經文項目在改版前已存在多筆筆記，系統 SHALL 僅顯示與允許編輯其中**建立時間最早**的一筆；其餘筆記 SHALL 保留於資料庫、SHALL NOT 顯示、SHALL NOT 被刪除。

UI 文案 SHALL 以 i18n key 取用，SHALL NOT 於元件寫死中文；驗證訊息 SHALL 置於 `validation.*` key 並以共用 `<FieldError>` 呈現。

#### Scenario: 展開課次即見三格表單

- **WHEN** 使用者在書籍子頁點開一個有經文項目的課次卡片
- **THEN** 該課次的三個經文項目各顯示一格，尚無筆記的格子直接呈現可填寫的建立表單，無「新增分段查經」按鈕

#### Scenario: 填寫後轉為檢視模式

- **WHEN** 使用者在某經文項目的建立表單填入總標題（非空）與選填欄位並儲存
- **THEN** 系統建立該格的筆記，該格轉為檢視卡（排版與文字大小比照「聯繫管理者」卡片），顯示各欄內容與填寫時間

#### Scenario: 總標題未填擋下

- **WHEN** 使用者未填總標題（或僅空白）即送出某格表單
- **THEN** 系統拒絕建立，於總標題欄位顯示必填錯誤訊息，不寫入資料庫

#### Scenario: 已填格子可再次編輯、不可刪除

- **WHEN** 使用者檢視某已填寫的經文項目格子
- **THEN** 該格顯示「編輯」入口可再次修改四個內容欄位，SHALL NOT 顯示任何刪除按鈕；編輯儲存後標示「已編輯」與更新時間

#### Scenario: 無經文項目的課次

- **WHEN** 使用者展開一個 `scriptures` 為空的課次
- **THEN** 展開區塊顯示「本課次無分段查經」提示，不提供任何格子或填寫入口

#### Scenario: 既有多筆只顯示最早一筆

- **WHEN** 某經文項目在改版前已存在兩筆以上筆記
- **THEN** 頁面僅顯示並允許編輯建立時間最早的一筆，其餘筆記不顯示且仍保留於資料庫

### Requirement: 筆記操作授權與伺服器端驗證

新增／編輯筆記 SHALL 由 Server Action 處理，且 SHALL 先驗證登入 session。

`createStudyEntry` SHALL 於伺服器端驗證：Zod 欄位、目標 `(courseCatalogId, lessonKey, scriptureKey)` 存在於大綱設定檔且該經文項目非空、且該 `courseCatalogId` 在該使用者的已解鎖集合內；任一不通過 SHALL 拒絕並回傳受控錯誤，不寫入資料。驗證通過後，`createStudyEntry` SHALL 以 `(userId, courseCatalogId, lessonKey, scriptureKey)` 查詢是否已有筆記：**已有則更新建立時間最早的那一筆之內容、SHALL NOT 另建第二筆**；沒有才建立新筆記。此行為 SHALL 為 idempotent，SHALL NOT 依賴資料庫唯一鍵。

`updateStudyEntry` SHALL 驗證目標筆記的 `userId` 等於當前 session 使用者，否則回傳無權限錯誤；SHALL NOT 因目錄事後未解鎖而拒絕（允許持續維護既有筆記）。

系統 SHALL NOT 對學員端提供刪除單筆筆記的 Server Action 入口（`deleteStudyEntry` 自學員流程移除）。

所有異動成功後 SHALL 呼叫 `revalidatePath` 更新頁面。伺服器端的登入、大綱合法性、解鎖與擁有者檢查 SHALL NOT 因本次 UI 改版而放寬。

#### Scenario: 未解鎖目錄無法新增

- **WHEN** 使用者對一個自己未解鎖的 `courseCatalogId` 呼叫 `createStudyEntry`
- **THEN** 系統回傳受控錯誤，不建立任何筆記

#### Scenario: 大綱路徑不合法無法新增

- **WHEN** `createStudyEntry` 帶入的 `lessonKey`／`scriptureKey` 在設定檔中不存在（或指向無經文項目的課次）
- **THEN** 系統回傳受控錯誤，不建立任何筆記

#### Scenario: 對已有筆記的格子再次送出不會產生第二筆

- **WHEN** 某經文項目已有一筆筆記，`createStudyEntry` 針對同一 `(courseCatalogId, lessonKey, scriptureKey)` 再次被呼叫（例如過期頁或併發）
- **THEN** 系統更新該格建立時間最早的那一筆之內容，資料庫中該格仍為原本的筆數，未新增列

#### Scenario: 非擁有者不能編輯

- **WHEN** 使用者對不屬於自己的筆記 id 呼叫 `updateStudyEntry`
- **THEN** 系統回傳 `{ success: false, message: '無權限' }`，不異動資料

#### Scenario: 未登入拒絕

- **WHEN** 未登入狀態呼叫任一筆記 Server Action
- **THEN** 系統拒絕操作，不異動資料

### Requirement: 書籍選擇頁與課次卡片牆

`/user/{spiritId}/learning` SHALL 以卡片方式列出所有課程目錄（依 `CourseCatalog.sortOrder`）作為「書籍」入口，卡片牆 SHALL 使用與個人首頁「授課單元」相同的響應式網格容器。此頁的頁面標題 SHALL 顯示為「分段式查經」（i18n key `learning.pageTitle`）。

`/user/{spiritId}/learning/{catalogId}` 書籍子頁的頁面標題（`<h1>`）SHALL 顯示為「分段式查經」＋ 該書籍名稱（例：「分段式查經 啟動靈人」）。子頁 SHALL 於標題下方顯示「已完成課次數 / 總課次數」，其中「已完成課次數」依「課次完成狀態」需求所定義的 `已完成` 與 `無需填寫` 兩態計算。

書籍子頁的課次 SHALL 以**垂直可收合清單**呈現（手機與桌機皆同一形式，SHALL NOT 使用卡片牆／響應式網格）。每一列 SHALL 顯示課次標題與「填寫狀態」視覺標記（四態，見「課次完成狀態」需求），點擊列頭 SHALL 於**該列就地**展開／收合該課次；同一時間 SHALL 至多展開一個課次。展開區塊 SHALL 直接呈現該課次每一個經文項目的一格（檢視卡或建立表單），SHALL NOT 提供「新增分段查經」按鈕或同一經文項目的多筆清單；三個經文項目的格子在窄螢幕單欄、`sm` 以上三欄排列。無經文項目的課次展開後 SHALL 顯示「本課次無分段查經」提示。

**預設展開哪一課**：使用者開啟書籍子頁時，系統 SHALL 依序判定並自動展開一個課次——

1. 若瀏覽器 `localStorage` 記有「該書籍上次展開的課次」且該課次仍存在於大綱 → 展開該課次。
2. 否則 → 展開**第一個**（依課次順序）填寫狀態為 `待填寫` 或 `填寫中` 的課次。
3. 否則（所有課次皆為 `已完成` 或 `無需填寫`）→ 全部維持收合。

「上次展開的課次」SHALL 以瀏覽器 `localStorage` 記錄，逐書籍（`courseCatalogId`）分開，SHALL NOT 寫入資料庫。當使用者展開某課次時 SHALL 更新該紀錄；當使用者把展開中的課次收合（無任何課次展開）時 SHALL 清除該紀錄。`localStorage` 不可用（無痕視窗／停用）時，系統 SHALL 靜默略過記憶功能，清單仍可手動展開／收合。首次伺服器算繪 SHALL 全部收合，展開於瀏覽器載入後套用（避免 hydration 不一致）。

#### Scenario: 書籍子頁標題含書名

- **WHEN** 使用者開啟「啟動靈人」書籍子頁
- **THEN** 頁面標題顯示「分段式查經 啟動靈人」，其下顯示「已完成 X / 共 12 課」

#### Scenario: 課次為垂直可收合清單

- **WHEN** 使用者在任一寬度的裝置開啟書籍子頁
- **THEN** 課次以垂直清單呈現，每列一個課次（標題＋狀態標記），非卡片牆

#### Scenario: 點擊列頭就地展開

- **WHEN** 使用者點擊一個有經文項目的課次列頭
- **THEN** 該列就地在下方展開，顯示其三個經文項目的格子（已填為檢視卡、未填為建立表單）；點擊另一列或再次點擊同一列頭時，原展開的課次收合

#### Scenario: 預設展開上次的課次

- **WHEN** 使用者上次在「啟動靈人」子頁展開過「第五課」，之後重新開啟同一書籍子頁
- **THEN** 「第五課」自動展開

#### Scenario: 無紀錄時展開第一個未完成課次

- **WHEN** 使用者首次開啟某書籍子頁（`localStorage` 無該書紀錄），且「第一課」為 `無需填寫`、「第二課」為 `待填寫`
- **THEN** 「第二課」自動展開

#### Scenario: 全部完成時全收合

- **WHEN** 使用者開啟一個所有課次皆為 `已完成` 或 `無需填寫` 的書籍子頁，且無 `localStorage` 紀錄
- **THEN** 所有課次維持收合，不自動展開任何一個

#### Scenario: localStorage 不可用時仍可操作

- **WHEN** 使用者在停用儲存空間的環境開啟書籍子頁
- **THEN** 不自動展開（或依既有記憶失敗而全收合），使用者仍可手動點列頭展開／收合，不出現錯誤

### Requirement: 課次完成狀態配色

課次卡片 SHALL 依「分段查經填寫進度」以顏色（邊框／標記）區分為**四態**並引導使用者填寫：

- `無需填寫`（`noScripture`）：課次**無經文項目**（如啟動靈人第一課、第十二課、啟動豐盛第一課）SHALL 一律視為此態，標示「無需填寫」，並計入「已完成課次數」。
- `已完成`（`done`）：課次**有經文項目**且該使用者在該課次的**每一個經文項目**都至少有一筆筆記 SHALL 視為此態，計入「已完成課次數」。
- `填寫中`（`partial`）：課次有經文項目且該使用者**已填寫其中一部分（1 格以上、但未填滿）**經文項目 SHALL 視為此態，以引導樣式呈現，SHALL NOT 計入「已完成課次數」。
- `待填寫`（`todo`）：課次有經文項目且該使用者在該課次**任一經文項目都沒有筆記** SHALL 視為此態，以引導樣式呈現，SHALL NOT 計入「已完成課次數」。

配色 SHALL 使用專案既有的樣式慣例，`已完成`／`無需填寫` SHALL 明顯有別於 `填寫中`／`待填寫`；SHALL NOT 僅以顏色作為唯一區分（每一態須另有文字標記，符合無障礙）。四態的文字標記 SHALL 以 i18n key 取用。

#### Scenario: 全部經文項目已填的課次顯示已完成態

- **WHEN** 使用者在「第三課：開啟靈覺（一）」下三個經文項目各有至少一筆筆記
- **THEN** 該課次卡片以 `已完成` 態呈現（完成色邊框 ＋「已完成」標記），並計入「已完成課次數」

#### Scenario: 部分經文項目已填的課次顯示填寫中態

- **WHEN** 使用者在「第四課：開啟靈覺（二）」下三個經文項目中僅一或兩個有筆記
- **THEN** 該課次卡片以 `填寫中` 態呈現（引導色 ＋「填寫中」標記），不計入「已完成課次數」

#### Scenario: 無任何筆記的課次顯示待填寫態

- **WHEN** 使用者在某有經文項目的課次下沒有任何筆記
- **THEN** 該課次卡片以 `待填寫` 態呈現（引導樣式 ＋「待填寫」標記），不計入「已完成課次數」

#### Scenario: 無經文項目的課次視為無需填寫

- **WHEN** 頁面渲染「第一課：接受禮物」或「第十二課：靈人全開啟」
- **THEN** 該課次卡片以 `無需填寫` 態呈現並標示「無需填寫」，且計入「已完成課次數」


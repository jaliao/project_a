# my-learning Delta（cr-spec-260828-012）

## MODIFIED Requirements

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

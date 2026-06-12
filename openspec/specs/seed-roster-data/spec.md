## ADDED Requirements

### Requirement: 名冊式 seed 基礎資料
`prisma/seed.ts` SHALL 由 `prisma/seed-data/roster.json`（源自 `doc/啟動事工資料表_updated.xlsx`）建立保留帳號（管理員、黃國倫）、課程目錄（啟動靈人系列）、教會清單，以及名冊人員（教師 roles 含 `teacher`、學員 roles 為 `user`）。
seed SHALL 為每個非空班級欄建立一筆掛啟動靈人（catalogId=1）的 `CourseInvite` 與對應 approved 報名；對應不到的教師歸入黃國倫收容課程。
seed SHALL 具冪等守衛（以收容班為哨兵），重複執行不產生重複課程／報名。

#### Scenario: 首次執行建立名冊資料
- **WHEN** 資料庫尚無收容班課程時執行 seed
- **THEN** 建立名冊人員、課程、報名與教會

#### Scenario: 重複執行不重複建立
- **WHEN** 資料庫已存在收容班課程時執行 seed
- **THEN** 跳過課程與報名建立

### Requirement: 教師取得啟動靈人結業證書
seed 建立報名時，若報名學員本身為教師（roles 含 `teacher`）SHALL 將該筆 `InviteEnrollment.graduatedAt` 設為快照日，使其取得啟動靈人結業證書。
由於每位教師至少在一門課（含收容班）當過學員，所有教師 SHALL 皆取得至少一張啟動靈人結業證書，具備實際開課資格。

#### Scenario: 教師學員的報名標記結業
- **WHEN** seed 為某筆報名建立資料，且該學員為教師
- **THEN** 該 `InviteEnrollment.graduatedAt` 有值

#### Scenario: 一般學員不標記結業
- **WHEN** seed 為某筆報名建立資料，且該學員非教師
- **THEN** 該 `InviteEnrollment.graduatedAt` 為 null

#### Scenario: 黃國倫具開課資格
- **WHEN** seed 執行完成
- **THEN** 黃國倫於啟動靈人有一筆 approved 且 graduatedAt 已設定的報名

### Requirement: 全教師班課程結業
seed 建立課程時，若該課程所有學員皆為教師（且至少一位學員）SHALL 將該 `CourseInvite.completedAt` 設為快照日（已結業）；其餘課程維持進行中（僅 `startedAt`）。
收容課程（學員皆為對應不到的教師）SHALL 被標記為已結業。

#### Scenario: 全教師班標記已結業
- **WHEN** 某課程所有學員皆為教師
- **THEN** 該課程 `completedAt` 有值

#### Scenario: 混合班維持進行中
- **WHEN** 某課程學員包含非教師
- **THEN** 該課程 `completedAt` 為 null（僅 `startedAt` 有值）

### Requirement: 報名教材為繁體
seed 建立的所有 `InviteEnrollment` SHALL 將 `materialChoice` 設為 `traditional`（繁體中文教材）。

#### Scenario: 所有報名為繁體教材
- **WHEN** seed 建立任一筆報名
- **THEN** 該報名 `materialChoice = traditional`

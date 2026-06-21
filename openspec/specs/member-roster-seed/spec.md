# member-roster-seed Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for member-roster-seed.

## Requirements

### Requirement: User 授課老師編號欄位
`User` model SHALL 新增 `teacherNo String?` 欄位，保存授課老師編號（如 `A001`）。學員（非教師）SHALL 為 null。此欄位不要求唯一。

#### Scenario: 教師具授課老師編號
- **WHEN** seed 由名冊教師列建立 `User`
- **THEN** 該 `User.teacherNo` 設為 Excel 之「授課老師編號」（如 `A001`）

#### Scenario: 學員無授課老師編號
- **WHEN** seed 由班級名單建立純學員 `User`
- **THEN** 該 `User.teacherNo` 為 null

### Requirement: 保留既有管理員與黃國倫
seed SHALL 保留 `101@iwillshare.org.tw`（系統管理員，superadmin，`PA000001`）與 `gordon@test.com`（黃國倫，`PA260001`）兩筆帳號；其餘人員一律來自名冊，不保留其他原測試學員。

#### Scenario: 管理員保留
- **WHEN** 執行 seed
- **THEN** `101@iwillshare.org.tw` 存在且具 `superadmin` 身分、spiritId `PA000001`

#### Scenario: 黃國倫保留
- **WHEN** 執行 seed
- **THEN** `gordon@test.com`（黃國倫）存在且 spiritId 為 `PA260001`

### Requirement: 由名冊建立教師與學員
seed SHALL 以姓名為唯一鍵，將名冊中的教師與所有班級學員建立為 `User`：
- 教師：`roles = [user, teacher]`、採 Excel Email（衝突或缺漏則用合成 Email）、設 `teacherNo`、`phone`、對應教會。
- 純學員：`roles = [user]`、合成 Email `{spiritId}@seed.iwillshare.org.tw`、預設密碼、`isTempPassword = true`。
- 同名者視為同一人；既是教師又是學員者合併為單一 `User` 並具 `[user, teacher]`。

#### Scenario: 建立教師帳號
- **WHEN** seed 處理名冊教師列
- **THEN** 建立具 `[user, teacher]` 身分、`teacherNo`、教會對應的 `User`

#### Scenario: 建立學員帳號
- **WHEN** seed 處理班級名單中的學員姓名
- **THEN** 建立具 `[user]` 身分、合成 Email、可登入的 `User`

#### Scenario: 教師兼學員合併
- **WHEN** 某姓名同時為教師且出現在他人班級名單
- **THEN** 僅建立一筆 `User`（`[user, teacher]`），並於其所屬班級建立報名

#### Scenario: 學員 Email 唯一且可登入
- **WHEN** 建立純學員 `User`
- **THEN** Email 為唯一的 `{spiritId}@seed.iwillshare.org.tw`，密碼為預設密碼且 `isTempPassword = true`

### Requirement: 每個班級欄建立一筆課程與報名
seed SHALL 為每位教師的每個非空「班級欄（班級一～十）」建立一筆 `CourseInvite`（`courseCatalogId = 1` 啟動靈人、`createdById = 該教師`、`startedAt` 設為快照日），並將該班學員以 `InviteEnrollment`（`status = approved`）報名。

#### Scenario: 每班一課程
- **WHEN** 某教師有 N 個非空班級欄
- **THEN** 為該教師建立 N 筆 `CourseInvite`，各 `createdById` 為該教師、掛 `啟動靈人`

#### Scenario: 班級學員報名
- **WHEN** 建立某班級對應的 `CourseInvite`
- **THEN** 該班每位學員建立一筆 `status = approved` 的 `InviteEnrollment`

### Requirement: 人人皆參加課程，對應不到歸黃國倫
seed SHALL 確保每位人員（含教師）皆至少參加一門課程並對應一位教師。教師若出現在他人班級即視為已參加；對應不到的教師 SHALL 由黃國倫建立一門收容課程（啟動靈人）並全部加入為 `approved` 報名。

#### Scenario: 教師對應到他人班級
- **WHEN** 某教師之姓名出現在另一位教師的班級名單
- **THEN** 該教師於該班建立報名，視為已參加課程

#### Scenario: 對應不到的教師歸黃國倫
- **WHEN** 某教師之姓名未出現在任何班級名單
- **THEN** 將其加入由黃國倫建立的收容課程（啟動靈人）為 `approved` 報名

### Requirement: 教會清單正規化
seed SHALL 將名冊「單位」正規化後建立 `Church`：合併 `GMI榮美`/`GMI榮美教會`、`i61為光教會`/`i61爲光教會` 等變體，最終為 101教會、Arise興起教會、GMI榮美教會、KUA、i61為光教會、全福會、心欣城市教會、桃園神帳幕教會、竹南靈糧堂、菲律賓共 10 間。具單位之 `User` SHALL 設 `churchType = church` 並關聯對應 `Church`。

#### Scenario: 教會變體合併
- **WHEN** 名冊出現 `GMI榮美` 與 `GMI榮美教會`（或 `為光`/`爲光` 變體）
- **THEN** 正規化為同一 `Church`，不重複建立

#### Scenario: 會員關聯教會
- **WHEN** 某人員之單位對應到清單中的教會
- **THEN** 該 `User.churchType = church` 且 `churchId` 指向對應 `Church`

### Requirement: Seed 來源不依賴執行期讀檔且可冪等
seed 資料 SHALL 來自預先產生且已提交的資料模組（由 xlsx 產生），執行期不讀取 xlsx。seed SHALL 可重複執行而不產生重複資料（人員以 email upsert、教會以 name upsert、課程以既有偵測旗標跳過）。

#### Scenario: 不依賴 xlsx 執行
- **WHEN** 執行 `make prisma-seed`
- **THEN** seed 僅讀取已提交之資料模組，無需 xlsx 檔存在

#### Scenario: 重複執行冪等
- **WHEN** 連續執行 seed 兩次
- **THEN** 不產生重複的 `User`／`Church`／`CourseInvite`／`InviteEnrollment`

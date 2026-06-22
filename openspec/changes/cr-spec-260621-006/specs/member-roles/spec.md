## MODIFIED Requirements

### Requirement: 多重身分資料模型
會員身分 SHALL 以身分集合表示，取代單一 `role` 欄位。可用身分為六種：一般會員（`user`）、三個書籍講師、管理者（`admin`）、超級管理者（`superadmin`）。三個書籍講師身分各對應一本書：`teacher_1`（啟動靈人）、`teacher_2`（啟動豐盛）、`teacher_3`（啟動得勝）。同一會員 SHALL 能同時持有多種身分，包含多個書籍講師身分。

#### Scenario: 會員持有多個書籍講師身分
- **WHEN** 某會員同時具備啟動靈人講師與啟動豐盛講師
- **THEN** 其身分集合包含 `teacher_1` 與 `teacher_2`，系統各項授權判定皆視其同時具備兩本書的授課資格

#### Scenario: 會員同時持有講師與管理者身分
- **WHEN** 某會員具備啟動靈人講師與管理者身分
- **THEN** 其身分集合包含 `teacher_1` 與 `admin`

#### Scenario: 僅一般會員
- **WHEN** 某會員未被指派任何加掛身分
- **THEN** 其身分集合僅含 `user`

### Requirement: 一般會員為身分基線
每位會員的身分集合 SHALL 至少包含 `user`（一般會員為基底）；`teacher_1`、`teacher_2`、`teacher_3`、`admin`、`superadmin` 為加掛身分。系統 SHALL NOT 允許將身分集合清空至不含 `user`。

#### Scenario: 加掛身分時保留基線
- **WHEN** 管理者為會員加上 `teacher_1` 身分
- **THEN** 該會員身分集合為 `{user, teacher_1}`，`user` 基線保留

#### Scenario: 移除所有加掛身分後仍為一般會員
- **WHEN** 管理者移除某會員的所有加掛身分
- **THEN** 該會員身分集合回到 `{user}`，仍可正常登入使用一般會員功能

### Requirement: 身分授權判定
系統 SHALL 提供集中式授權判定，作為所有守衛的單一真實來源：
- `canAccessAdmin`：身分集合含 `admin` 或 `superadmin`
- `isSuperadmin`：身分集合含 `superadmin`
- `canTeachBook(courseCatalogId)`：身分集合含該書對應的書籍講師身分（依「講師身分與書籍對應」），或含 `admin` 或 `superadmin`
- `canTeachAny`：身分集合含任一書籍講師身分（`teacher_1`～`teacher_3`），或含 `admin` 或 `superadmin`；用於判斷是否顯示講師相關入口或視圖
- `hasRole`：泛用判定身分集合是否含指定身分

#### Scenario: 管理者可存取後台
- **WHEN** 身分集合含 `admin` 或 `superadmin`
- **THEN** `canAccessAdmin` 為真，允許存取後台

#### Scenario: 持有對應書籍講師身分可教該書
- **WHEN** 身分集合含 `teacher_2`（啟動豐盛講師）
- **THEN** `canTeachBook(2)` 為真，`canTeachBook(1)` 為假（未持有 `teacher_1`）

#### Scenario: 管理者視同具所有書籍開課權限
- **WHEN** 身分集合含 `admin` 或 `superadmin`（即使未含任何書籍講師身分）
- **THEN** 對任一 `courseCatalogId`，`canTeachBook` 皆為真，且 `canTeachAny` 為真

#### Scenario: 一般會員無後台與開課權限
- **WHEN** 身分集合僅含 `user`
- **THEN** `canAccessAdmin`、`canTeachAny` 皆為假，且對任一書 `canTeachBook` 為假

### Requirement: 講師身分與書籍對應
系統 SHALL 維護一份「書籍講師身分 ↔ 課程目錄（`CourseCatalog`）」的對應，作為授權判定與標籤顯示的單一真實來源。對應關係為：`teacher_1` ↔ `courseCatalogId = 1`（啟動靈人）、`teacher_2` ↔ `courseCatalogId = 2`（啟動豐盛）、`teacher_3` ↔ `courseCatalogId = 3`（啟動得勝）。授權與顯示邏輯 SHALL NOT 自行硬編碼書籍與身分的對應，皆須引用此單一來源。

#### Scenario: 由身分查得對應書籍
- **WHEN** 系統需判斷 `teacher_3` 對應的書
- **THEN** 取得 `courseCatalogId = 3`（啟動得勝）

#### Scenario: 由書籍查得對應講師身分
- **WHEN** 系統需判斷 `courseCatalogId = 2` 的授課所需身分
- **THEN** 取得 `teacher_2`（啟動豐盛講師）

#### Scenario: 非講師對應的課程目錄無對應身分
- **WHEN** 查詢一個不在對應表內的 `courseCatalogId`
- **THEN** 對應結果為空，`canTeachBook` 對該書僅對 `admin`／`superadmin` 為真

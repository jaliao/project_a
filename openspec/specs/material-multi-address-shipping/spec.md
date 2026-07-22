# material-multi-address-shipping Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for material-multi-address-shipping.
## Requirements
### Requirement: 寄送模式選擇
教材申請時，講師 SHALL 能選擇寄送模式為「單一地址」或「多個地址」。選擇「單一地址」時，系統行為 SHALL 與現行單一地址流程完全相同（不建立任何寄送批次子紀錄）。模式切換 SHALL NOT 遺失已填寫的另一模式欄位資料；`single` 模式下，`shipments` 殘留內容 SHALL NOT 參與驗證、SHALL NOT 阻擋送出，且送單時 SHALL NOT 被採用。

#### Scenario: 選擇單一地址
- **WHEN** 講師於教材申請選擇「寄送單一地址」
- **THEN** 沿用現行單一地址欄位與流程，不建立寄送批次紀錄

#### Scenario: 選擇多個地址
- **WHEN** 講師於教材申請選擇「寄送多個地址」
- **THEN** 顯示可新增/刪除的寄送地址清單，每個地址含寄件方式與各版本本數

#### Scenario: 多地址切回單一地址後可送出
- **WHEN** 講師先切至「多個地址」並新增未填完的地址列，再切回「單一地址」且單一地址資訊已填妥後送出
- **THEN** 系統允許送出，殘留的多地址列不觸發任何驗證錯誤，且不建立任何寄送批次紀錄

#### Scenario: 切換模式保留已填資料
- **WHEN** 講師於「多個地址」填寫部分地址列後切回「單一地址」，再切回「多個地址」
- **THEN** 先前填寫的地址列資料仍存在，未被清空

### Requirement: 寄送批次資料模型
系統 SHALL 提供寄送批次紀錄，關聯至單一 `CourseOrder`，每筆 SHALL 包含：收件人（`recipientName`）、連絡電話（`recipientPhone`）、寄件方式（`deliveryMethod`）、宅配地址（`deliveryAddress`）、超商門市店號（`storeId`）與店名（`storeName`）、繁體本數、簡體本數、英文本數，以及寄送時間（`shippedAt`，未寄送時為 null）。

#### Scenario: 多地址申請建立寄送批次
- **WHEN** 講師以多地址模式送出申請，含 N 個寄送地址
- **THEN** 系統為該 `CourseOrder` 建立 N 筆寄送批次，各自記錄收件人／連絡電話／寄件方式／地址／繁體本數／簡體本數／英文本數，`shippedAt` 初始為 null

#### Scenario: 超商批次門市必填
- **WHEN** 某寄送批次 `deliveryMethod` 為 `sevenEleven` 或 `familyMart`
- **THEN** 該批次 SHALL 記錄門市選擇器選取的 `storeId` 與 `storeName`

### Requirement: 多地址每個地址必填收件人與連絡電話
多地址模式（`shipMode === 'multiple'`）下，每個寄送地址 SHALL 必填「收件人」與「連絡電話」。未填寫任一欄位的地址 SHALL NOT 允許送出。此逐項必填驗證 SHALL 僅於多地址模式生效；單一地址模式下 SHALL NOT 對 `shipments` 內容執行任何逐項驗證。

#### Scenario: 多地址清單每列含收件人與連絡電話欄位
- **WHEN** 講師選擇「寄送多個地址」並新增寄送地址
- **THEN** 每個地址列顯示「收件人」與「連絡電話」輸入欄位，與寄件方式、地址、各版本本數並列

#### Scenario: 地址缺收件人或連絡電話時擋下送出
- **WHEN** 多地址模式下，多地址清單中任一地址的收件人或連絡電話為空
- **THEN** 系統拒絕送出並提示該地址需填寫收件人與連絡電話（錯誤訊息顯示於對應地址列）

#### Scenario: 各地址收件人獨立
- **WHEN** 講師為不同地址填寫不同的收件人與連絡電話
- **THEN** 各寄送批次各自儲存其收件人與連絡電話，互不影響

#### Scenario: 單一地址模式不驗證多地址欄位
- **WHEN** `shipMode === 'single'` 且 `shipments` 含未填完的殘留列
- **THEN** 系統不對該等列執行收件人/電話/門市/地址/書本指派之必填驗證

### Requirement: 依版本分配書本直到全部完成
多地址教材寄送 SHALL 由「繁/簡/英數量拆分」改為「逐本書本項目指派」：老師先建立各寄送地址（收件人＋門市/宅配），再將書本項目（學員書本名字＋版本）指派至各地址。每個 `MaterialShipment` 的繁/簡/英本數 SHALL 由其已指派項目推導，不再由老師手動輸入數量。訂單送出前，所有書本項目 SHALL 皆被指派且僅屬一個地址。老師端寄送檢視 SHALL 顯示各地址的「學員名＋版本」清單。

（系統未上線、無舊資料：書本項目為單一真相，數量欄位為推導值。）

#### Scenario: 逐本指派取代數量輸入
- **WHEN** 老師以多地址建立教材訂單
- **THEN** 不再手動填各地址繁/簡/英數量，而是將書本項目指派到地址，數量由項目推導

#### Scenario: 各地址顯示學員清單
- **WHEN** 檢視某多地址訂單
- **THEN** 每個地址顯示其指派的學員名＋書本名字＋版本清單

#### Scenario: 未指派完成不可送出
- **WHEN** 仍有書本項目未指派任何地址
- **THEN** 阻擋送出並提示待指派項目

### Requirement: 多地址逐批次寄送與完成判定
多地址模式下，管理者 SHALL 能逐個寄送批次標記寄送（設該批次 `shippedAt`）。當該 `CourseOrder` 的所有寄送批次皆已寄送時，系統 SHALL 自動將 `CourseOrder.shippedAt` 設為最後一批次的寄送時間，使講師既有收件確認流程不變。

#### Scenario: 標記單一批次寄送
- **WHEN** 管理者對某未寄送批次點擊「確認已寄送」
- **THEN** 該批次 `shippedAt` 設為當前時間，其餘未寄送批次狀態不變

#### Scenario: 全部批次寄完自動完成
- **WHEN** 某 `CourseOrder` 的最後一個未寄送批次被標記寄送
- **THEN** 系統自動將 `CourseOrder.shippedAt` 設為該批次寄送時間（訂單視為已寄送）

#### Scenario: 尚有批次未寄送時訂單未完成
- **WHEN** 仍有至少一個批次 `shippedAt` 為 null
- **THEN** `CourseOrder.shippedAt` 維持 null（訂單尚未完成寄送）


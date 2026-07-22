## MODIFIED Requirements

### Requirement: 寄送批次資料模型
系統 SHALL 提供寄送批次紀錄，關聯至單一 `CourseOrder`，每筆 SHALL 包含：收件人（`recipientName`）、連絡電話（`recipientPhone`）、寄件方式（`deliveryMethod`）、宅配地址（`deliveryAddress`）、超商門市店號（`storeId`）與店名（`storeName`）、繁體本數、簡體本數、英文本數，以及寄送時間（`shippedAt`，未寄送時為 null）。

#### Scenario: 多地址申請建立寄送批次
- **WHEN** 講師以多地址模式送出申請，含 N 個寄送地址
- **THEN** 系統為該 `CourseOrder` 建立 N 筆寄送批次，各自記錄收件人／連絡電話／寄件方式／地址／繁體本數／簡體本數／英文本數，`shippedAt` 初始為 null

#### Scenario: 超商批次門市必填
- **WHEN** 某寄送批次 `deliveryMethod` 為 `sevenEleven` 或 `familyMart`
- **THEN** 該批次 SHALL 記錄門市選擇器選取的 `storeId` 與 `storeName`

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

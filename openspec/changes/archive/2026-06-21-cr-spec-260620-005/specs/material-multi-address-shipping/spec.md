## MODIFIED Requirements

### Requirement: 寄送批次資料模型
系統 SHALL 提供寄送批次紀錄，關聯至單一 `CourseOrder`，每筆 SHALL 包含：收件人（`recipientName`）、連絡電話（`recipientPhone`）、寄件方式（`deliveryMethod`）、宅配地址（`deliveryAddress`）、超商門市店號（`storeId`）與店名（`storeName`）、繁體本數、簡體本數，以及寄送時間（`shippedAt`，未寄送時為 null）。

#### Scenario: 多地址申請建立寄送批次
- **WHEN** 講師以多地址模式送出申請，含 N 個寄送地址
- **THEN** 系統為該 `CourseOrder` 建立 N 筆寄送批次，各自記錄收件人／連絡電話／寄件方式／地址／繁體本數／簡體本數，`shippedAt` 初始為 null

#### Scenario: 超商批次門市必填
- **WHEN** 某寄送批次 `deliveryMethod` 為 `sevenEleven` 或 `familyMart`
- **THEN** 該批次 SHALL 記錄門市選擇器選取的 `storeId` 與 `storeName`

## ADDED Requirements

### Requirement: 多地址每個地址必填收件人與連絡電話
多地址模式下，每個寄送地址 SHALL 必填「收件人」與「連絡電話」。未填寫任一欄位的地址 SHALL NOT 允許送出。

#### Scenario: 多地址清單每列含收件人與連絡電話欄位
- **WHEN** 講師選擇「寄送多個地址」並新增寄送地址
- **THEN** 每個地址列顯示「收件人」與「連絡電話」輸入欄位，與寄件方式、地址、各版本本數並列

#### Scenario: 地址缺收件人或連絡電話時擋下送出
- **WHEN** 多地址清單中任一地址的收件人或連絡電話為空
- **THEN** 系統拒絕送出並提示該地址需填寫收件人與連絡電話

#### Scenario: 各地址收件人獨立
- **WHEN** 講師為不同地址填寫不同的收件人與連絡電話
- **THEN** 各寄送批次各自儲存其收件人與連絡電話，互不影響

## ADDED Requirements

### Requirement: 寄送模式選擇
教材申請時，講師 SHALL 能選擇寄送模式為「單一地址」或「多個地址」。選擇「單一地址」時，系統行為 SHALL 與現行單一地址流程完全相同（不建立任何寄送批次子紀錄）。

#### Scenario: 選擇單一地址
- **WHEN** 講師於教材申請選擇「寄送單一地址」
- **THEN** 沿用現行單一地址欄位與流程，不建立寄送批次紀錄

#### Scenario: 選擇多個地址
- **WHEN** 講師於教材申請選擇「寄送多個地址」
- **THEN** 顯示可新增/刪除的寄送地址清單，每個地址含寄件方式與各版本本數

### Requirement: 寄送批次資料模型
系統 SHALL 提供寄送批次紀錄，關聯至單一 `CourseOrder`，每筆 SHALL 包含：寄件方式（`deliveryMethod`）、宅配地址（`deliveryAddress`）、超商門市店號（`storeId`）與店名（`storeName`）、繁體本數、簡體本數，以及寄送時間（`shippedAt`，未寄送時為 null）。

#### Scenario: 多地址申請建立寄送批次
- **WHEN** 講師以多地址模式送出申請，含 N 個寄送地址
- **THEN** 系統為該 `CourseOrder` 建立 N 筆寄送批次，各自記錄寄件方式／地址／繁體本數／簡體本數，`shippedAt` 初始為 null

#### Scenario: 超商批次門市必填
- **WHEN** 某寄送批次 `deliveryMethod` 為 `sevenEleven` 或 `familyMart`
- **THEN** 該批次 SHALL 記錄門市選擇器選取的 `storeId` 與 `storeName`

### Requirement: 依版本分配書本直到全部完成
多地址模式下，所有寄送批次的繁體本數總和 SHALL 等於應寄繁體本數，簡體本數總和 SHALL 等於應寄簡體本數；應寄本數取自該課程 approved 學員的 `materialChoice` 統計（繁體 = `traditional` 人數、簡體 = `simplified` 人數）。未分配完畢前 SHALL NOT 允許送出。

#### Scenario: 分配未完成時擋下送出
- **WHEN** 多地址各批次本數總和未等於應寄繁體/簡體本數
- **THEN** 系統拒絕送出並提示尚未分配完畢的剩餘本數

#### Scenario: 分配剛好完成
- **WHEN** 各批次繁體本數總和 = 應寄繁體本數，且簡體本數總和 = 應寄簡體本數
- **THEN** 允許送出，建立對應寄送批次

#### Scenario: 即時顯示剩餘本數
- **WHEN** 講師於多地址清單調整各批次本數
- **THEN** 介面即時顯示繁體／簡體尚待分配的剩餘本數

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

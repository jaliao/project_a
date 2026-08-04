# admin-material-management Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for admin-material-management.
## Requirements
### Requirement: 管理者批價與確認收款操作
管理頁 SHALL 依訂單付款狀態提供操作：狀態「待批價」顯示「批價」按鈕（開啟金額＋匯款帳號資訊對話框，帳號資訊欄為 textarea、預設帶入系統設定值），呼叫 `quoteMaterialOrder`；狀態「待確認收款」顯示老師回填的匯款後五碼與「確認收款」按鈕，呼叫 `confirmMaterialPayment`。管理頁狀態標籤 SHALL 涵蓋待批價／待付款／待確認收款／待寄送／已寄送／已收件。訂單詳情之「匯款帳號資訊」SHALL 保留換行呈現（`whitespace-pre-wrap` 或等效）。

#### Scenario: 待批價顯示批價按鈕
- **WHEN** 管理者檢視狀態為「待批價」的申請
- **THEN** 顯示「批價」按鈕，點擊開啟含金額與匯款帳號資訊（textarea，預設帶入 `remittance_account` 設定值）的對話框

#### Scenario: 待確認收款顯示後五碼與確認鈕
- **WHEN** 管理者檢視狀態為「待確認收款」的申請
- **THEN** 顯示老師回填的匯款後五碼與「確認收款」按鈕

#### Scenario: 狀態標籤涵蓋付款階段
- **WHEN** 管理者檢視教材申請列表
- **THEN** 每筆申請依推導顯示對應狀態標籤（待批價／待付款／待確認收款／待寄送／已寄送／已收件）

#### Scenario: 訂單詳情多行顯示匯款帳號資訊
- **WHEN** 管理者展開已批價訂單詳情
- **THEN** 「匯款帳號資訊」以保留換行的區塊呈現批價時的快照內容

### Requirement: 管理者確認已寄送
管理頁 SHALL 在狀態為「待寄送」的申請列顯示「確認已寄送」按鈕，點擊後呼叫 `confirmShipment(orderId)` Server Action。「確認已寄送」SHALL 僅在訂單已確認收款（`paymentConfirmedAt != null`）後可用；未確認收款的訂單 SHALL NOT 顯示或允許寄送確認。

對於多地址寄送的訂單，管理頁 SHALL 改為列出各寄送批次，並於每個未寄送批次顯示「確認已寄送」按鈕；確認時僅標記該批次 `shippedAt`。當該訂單所有批次皆已寄送時，系統 SHALL 自動將 `CourseOrder.shippedAt` 設為最後一批次寄送時間，狀態更新為「已寄送」。單一地址訂單行為維持不變（整張一次確認）。

#### Scenario: 點擊確認已寄送成功（單一地址）
- **WHEN** 管理者對已確認收款的單一地址訂單點擊「確認已寄送」
- **THEN** `CourseOrder.shippedAt` 設為當前時間，列表刷新，狀態更新為「已寄送」，顯示「已標記為已寄送」toast

#### Scenario: 逐批次確認（多地址）
- **WHEN** 管理者對已確認收款的多地址訂單的某未寄送批次點擊「確認已寄送」
- **THEN** 僅該批次 `shippedAt` 設為當前時間；若仍有批次未寄送，`CourseOrder.shippedAt` 維持 null

#### Scenario: 多地址全部寄完
- **WHEN** 管理者標記多地址訂單的最後一個未寄送批次
- **THEN** 系統自動將 `CourseOrder.shippedAt` 設為該批次時間，狀態更新為「已寄送」

#### Scenario: 未確認收款不可寄送
- **WHEN** 訂單 `paymentConfirmedAt == null`（尚未確認收款）
- **THEN** 不顯示「確認已寄送」按鈕；若直接呼叫 `confirmShipment`／`confirmShipmentBatch` 則回傳 `{ success: false, message: '尚未確認收款' }`

#### Scenario: 已寄送的申請不顯示確認按鈕
- **WHEN** `CourseOrder.shippedAt != null`（或對應批次已寄送）
- **THEN** 不顯示該層級的「確認已寄送」按鈕

#### Scenario: 非管理者無法呼叫 confirmShipment
- **WHEN** role 非 admin/superadmin 的使用者呼叫 `confirmShipment`
- **THEN** 回傳 `{ success: false, message: '無權限' }`

### Requirement: 後台管理頁列印出貨單按鈕
管理頁每筆申請 SHALL 提供「列印出貨單」按鈕，點擊後開啟出貨單列印頁。

#### Scenario: 點擊列印出貨單
- **WHEN** 管理者點擊「列印出貨單」按鈕
- **THEN** 以新分頁導覽至 `/admin/materials/[id]/print`

#### Scenario: 所有申請均顯示列印按鈕
- **WHEN** 管理者檢視教材申請列表
- **THEN** 每筆申請（無論狀態）均顯示「列印出貨單」按鈕

### Requirement: 教材申請列表欄位整理
後台教材申請列表 SHALL 移除「教材版本」與「數量」欄，並新增「課程編號」欄顯示該訂單所連結之 `courseInviteId`（格式 `#<id>`）。獨立訂單（無連結課程）SHALL 於該欄顯示「—」。教材版本與書本數量資訊 SHALL 仍保留於展開詳情中，不因列表移除而遺失。

#### Scenario: 列表不再顯示教材版本與數量欄
- **WHEN** 管理者檢視教材申請列表
- **THEN** 表頭與資料列皆不含「教材版本」與「數量」欄

#### Scenario: 列表顯示課程編號
- **WHEN** 管理者檢視連結至某課程的教材申請
- **THEN** 列表於「課程編號」欄顯示 `#<courseInviteId>`

#### Scenario: 獨立訂單課程編號顯示破折號
- **WHEN** 管理者檢視未連結課程的獨立訂單
- **THEN** 「課程編號」欄顯示「—」

#### Scenario: 版本與數量仍可於詳情查看
- **WHEN** 管理者展開任一訂單詳情
- **THEN** 仍可見教材版本與書本數量（繁 X / 簡 Y / 英 Z）

### Requirement: 收件地址顯示收件人姓名與聯絡電話
展開訂單詳情時，系統 SHALL 於每個收件地址顯示收件人姓名與聯絡電話。單一地址（`shipMode = single`）取自 `CourseOrder.recipientName` / `recipientPhone`；多地址（`shipMode = multiple`）每個寄送批次取自對應 `MaterialShipment.recipientName` / `recipientPhone`。欄位為空時 SHALL 顯示「—」。

#### Scenario: 單一地址顯示收件人
- **WHEN** 管理者展開單一地址訂單詳情
- **THEN** 於收件資訊顯示收件人姓名與聯絡電話

#### Scenario: 多地址每批顯示收件人
- **WHEN** 管理者展開多地址訂單詳情
- **THEN** 每個地址列除「取貨方式 — 門市（店號）　繁 X / 簡 Y / 英 Z」外，另顯示該批收件人姓名與聯絡電話

#### Scenario: 收件人未填顯示破折號
- **WHEN** 某收件地址未填收件人姓名或電話
- **THEN** 對應欄位顯示「—」

### Requirement: 各收件地址內部備註
系統 SHALL 允許管理者/工作人員對每個收件地址加註內部備註以利出貨與聯繫紀錄。單一地址訂單 SHALL 將備註存於 `CourseOrder.note`（一則）；多地址訂單 SHALL 將備註分別存於各 `MaterialShipment.note`（每個地址一則）。備註 SHALL 可於訂單詳情檢視與編輯，並透過 Server Action 儲存後刷新呈現。備註為內部用途，SHALL NOT 顯示於老師/購買人的前台畫面。

#### Scenario: 單一地址新增備註
- **WHEN** 管理者於單一地址訂單詳情輸入備註並儲存
- **THEN** 寫入 `CourseOrder.note`，刷新後於該訂單詳情顯示該備註

#### Scenario: 多地址各地址分別備註
- **WHEN** 管理者於多地址訂單的某個地址列輸入備註並儲存
- **THEN** 僅該地址對應的 `MaterialShipment.note` 更新，其他地址備註不受影響

#### Scenario: 備註不顯示於前台
- **WHEN** 老師/購買人於前台檢視自己的教材訂單
- **THEN** 不顯示任何內部備註

#### Scenario: 備註持久保存
- **WHEN** 管理者儲存備註後重新整理教材申請列表並再次展開
- **THEN** 既存備註仍正確顯示

### Requirement: 教材申請顯示各地址學員書本項目
後台教材申請詳情 SHALL 於每個寄送地址呈現指派的書本項目「學員名（書本名字）＋版本（繁/簡/英）」清單，供管理者確認哪些書送到哪個地址。單一地址訂單 SHALL 呈現該課程全部書本項目；多地址訂單 SHALL 依各地址已指派項目呈現。出貨單列印亦 SHALL 帶出各地址的書本項目清單。

#### Scenario: 多地址顯示各地址書本清單
- **WHEN** 管理者展開多地址教材訂單詳情
- **THEN** 每個地址顯示其指派的學員名＋書本名字＋版本

#### Scenario: 單一地址顯示全部書本
- **WHEN** 管理者展開單一地址教材訂單詳情
- **THEN** 顯示該課程全部書本項目（學員名＋書本名字＋版本）

#### Scenario: 列印帶出書本清單
- **WHEN** 管理者列印某地址出貨單
- **THEN** 出貨單含該地址的書本項目清單

### Requirement: 單一地址訂單顯示書本清單
後台教材申請詳情與出貨單列印，於單一地址訂單 SHALL 顯示書本清單（學員名稱＋書本名字＋版本繁/簡/英），以利管理者製作印上名字的書。清單由該課程書本項目推導。

#### Scenario: 後台單一地址顯示書本清單
- **WHEN** 管理者展開單一地址教材訂單詳情
- **THEN** 於書本數量下方顯示書本清單（學員名（書本名字）· 繁/簡/英）

#### Scenario: 列印單一地址帶書本清單
- **WHEN** 管理者列印單一地址出貨單
- **THEN** 出貨單含該訂單的書本清單

### Requirement: 各批次書本清單顯示學員名稱
後台教材申請詳情與出貨單列印，於各寄送批次（單一與多地址一致）之書本清單 SHALL 顯示「學員名稱＋書本名字＋版本（繁/簡/英）」，來源為該批次的 `MaterialShipmentItem`（含 `studentName` 快照）。單一地址訂單亦讀取其自身批次項目呈現。

#### Scenario: 多地址各批顯示學員名
- **WHEN** 管理者展開多地址訂單詳情或列印某批次出貨單
- **THEN** 各批書本清單顯示學員名（書本名字）· 繁/簡/英

#### Scenario: 單一地址顯示學員名
- **WHEN** 管理者展開單一地址訂單詳情或列印其出貨單
- **THEN** 顯示該訂單自身批次的書本清單（學員名（書本名字）· 繁/簡/英）

### Requirement: 後台不提供教材訂單編輯
後台教材申請管理 SHALL NOT 提供事後編輯訂單快照（收件人、寄送方式、數量等）的功能，以避免與申請時快照不一致。訂單詳情 SHALL NOT 顯示「編輯」按鈕。管理者仍可進行既有的批價、確認收款、確認寄送與地址內部備註等作業。

#### Scenario: 訂單詳情無編輯按鈕
- **WHEN** 管理者展開教材訂單詳情
- **THEN** 不顯示「編輯」按鈕，亦無法修改訂單快照欄位

### Requirement: 教材申請列表分頁籤
`/admin/materials` SHALL 提供「全部」「待處理」「已完成」三個分頁籤篩選列表；預設顯示「全部」。「待處理」SHALL 涵蓋除「已完成」外的所有狀態（待批價、待付款、待確認收款、待寄送）；「已完成」SHALL 涵蓋已寄送、已收件。切換分頁籤 SHALL 為純前端篩選，不重新查詢伺服器資料。

#### Scenario: 預設顯示全部
- **WHEN** 管理者開啟 `/admin/materials`
- **THEN** 預設選中「全部」分頁籤，列表顯示所有申請

#### Scenario: 切換待處理分頁籤
- **WHEN** 管理者點擊「待處理」分頁籤
- **THEN** 列表僅顯示狀態為待批價、待付款、待確認收款、待寄送的申請

#### Scenario: 切換已完成分頁籤
- **WHEN** 管理者點擊「已完成」分頁籤
- **THEN** 列表僅顯示狀態為已寄送、已收件的申請

### Requirement: 教材申請列表講師欄位不顯示 Email
列表「講師」欄位 SHALL NOT 顯示該講師的 Email，僅顯示姓名。

#### Scenario: 講師欄位僅顯示姓名
- **WHEN** 管理者檢視教材申請列表
- **THEN** 「講師」欄位僅顯示講師姓名，不顯示 Email

### Requirement: 教材申請詳情整合會員標籤顯示講師
展開教材申請詳情時，若該申請關聯的 `CourseInvite` 有建立者（真實會員帳號），系統 SHALL 以「會員標籤」（見 `admin-member-tag`）呈現該講師；若申請未關聯任何 `CourseInvite`（獨立訂單），SHALL NOT 顯示會員標籤區塊。

#### Scenario: 有關聯講師時顯示會員標籤
- **WHEN** 管理者展開一筆有關聯 `CourseInvite` 的教材申請詳情
- **THEN** 詳情區顯示該講師的會員標籤，可點擊檢視或傳訊息

#### Scenario: 獨立訂單不顯示會員標籤
- **WHEN** 管理者展開一筆未關聯任何課程的獨立教材申請詳情
- **THEN** 詳情區不顯示會員標籤區塊


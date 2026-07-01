## ADDED Requirements

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
- **THEN** 仍可見教材版本與書本數量（繁 X / 簡 Y）

### Requirement: 收件地址顯示收件人姓名與聯絡電話
展開訂單詳情時，系統 SHALL 於每個收件地址顯示收件人姓名與聯絡電話。單一地址（`shipMode = single`）取自 `CourseOrder.recipientName` / `recipientPhone`；多地址（`shipMode = multiple`）每個寄送批次取自對應 `MaterialShipment.recipientName` / `recipientPhone`。欄位為空時 SHALL 顯示「—」。

#### Scenario: 單一地址顯示收件人
- **WHEN** 管理者展開單一地址訂單詳情
- **THEN** 於收件資訊顯示收件人姓名與聯絡電話

#### Scenario: 多地址每批顯示收件人
- **WHEN** 管理者展開多地址訂單詳情
- **THEN** 每個地址列除「取貨方式 — 門市（店號）　繁 X / 簡 Y」外，另顯示該批收件人姓名與聯絡電話

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

## ADDED Requirements

### Requirement: 單一地址亦以逐本項目呈現
單一地址（`shipMode = single`）教材訂單 SHALL 亦以逐本書本項目呈現，其書本清單由該課程報名推導（`getCourseBookItems`：已核准且選了版本者），視為全部書送至此單一地址。每個項目 SHALL 含學員名稱、書本名字與版本（繁/簡）。此為顯示推導，不需建立寄送批次或項目資料。

#### Scenario: 單一地址列出書本項目
- **WHEN** 檢視某單一地址教材訂單
- **THEN** 顯示該課程書本項目清單（學員名＋書本名字＋版本）

#### Scenario: 獨立訂單無課程則為空
- **WHEN** 訂單未連結課程（無 `courseInviteId`）
- **THEN** 書本清單為空

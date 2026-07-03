# admin-sensitive-masking Specification（cr-spec-260701-008）

## ADDED Requirements

### Requirement: 機敏欄位遮蔽顯示
後台學員頁面之機敏欄位（電話、電子郵件）SHALL 預設以固定字串 `***` 遮蔽呈現（不反映實際內容長度），管理者點擊後 SHALL 切換為明文檢視，再次點擊 SHALL 恢復遮蔽。遮蔽 SHALL 為顯示層行為，不影響資料查詢、搜尋比對與其他功能。

#### Scenario: 預設遮蔽
- **WHEN** 管理者開啟含機敏欄位的學員頁面
- **THEN** 電話與 Email 欄位顯示 `***`，不顯示明文

#### Scenario: 點擊檢視明文
- **WHEN** 管理者點擊遮蔽中的機敏欄位
- **THEN** 該欄位切換為明文顯示，且可選取複製

#### Scenario: 再次點擊恢復遮蔽
- **WHEN** 管理者點擊已顯示明文的機敏欄位
- **THEN** 該欄位恢復為 `***` 遮蔽

#### Scenario: 逐筆獨立切換
- **WHEN** 管理者在清單中點擊某一列的 Email 檢視明文
- **THEN** 僅該列顯示明文，其他列維持遮蔽

### Requirement: 遮蔽欄位空值與可近性
機敏欄位值為空（null／空字串）時 SHALL 直接顯示 `—` 且不可點擊、不顯示 `***`。遮蔽切換 SHALL 以按鈕語意實作（鍵盤可操作），並提供狀態對應的 aria-label 與視覺提示圖示（眼睛開／閉）。

#### Scenario: 空值顯示破折號
- **WHEN** 某會員的電話未填寫
- **THEN** 電話欄位顯示 `—`，無遮蔽切換互動

#### Scenario: 鍵盤操作切換
- **WHEN** 管理者以鍵盤聚焦遮蔽欄位並按下 Enter／Space
- **THEN** 欄位在遮蔽與明文間切換，aria-label 隨狀態更新

## ADDED Requirements

### Requirement: 招生階段編輯課程資訊
課程詳情頁 `/course/[id]` SHALL 在課程為**招生中**（`startedAt = null`、`cancelledAt = null`、`completedAt = null`）且檢視者為**該課程授課老師（開課者本人）或管理者**時，提供「編輯課程資訊」入口。
可編輯欄位 SHALL 為：課程名稱、預計人數（maxCount）、邀請截止日、預計開課日、內部備註。
SHALL NOT 開放修改課程書本（`courseCatalogId`）。
非招生中或非授權者 SHALL NOT 看到編輯入口，且對應 server action SHALL 拒絕。

#### Scenario: 招生中講師可編輯
- **WHEN** 授課老師於招生中課程開啟詳情頁
- **THEN** 顯示「編輯課程資訊」入口，可修改名稱／人數／截止日／開課日／備註

#### Scenario: 非招生中不可編輯
- **WHEN** 課程已開始、已取消或已結業
- **THEN** 不顯示編輯入口；若仍呼叫 server action，回傳失敗（課程非招生中，無法編輯）

#### Scenario: 非授權者不可編輯
- **WHEN** 非開課者且非管理者嘗試編輯
- **THEN** server action 回傳無權限

### Requirement: 預計人數編輯限制
編輯課程資訊時，`maxCount` SHALL 為整數且 **1 ≤ maxCount ≤ 7**，且 SHALL NOT 低於該課程當下**已核准（approved）學員數**（以 server 端當下資料為準）。
編輯介面 SHALL 顯示「每班最多 7 人」之提醒文字。

#### Scenario: 低於已核准學員數被拒
- **WHEN** 課程已有 5 位已核准學員，講師將 maxCount 改為 4 並送出
- **THEN** 系統拒絕並提示人數不可低於已核准學員數（5）

#### Scenario: 超過 7 人被拒
- **WHEN** 講師將 maxCount 改為 8 並送出
- **THEN** 系統拒絕並提示每班最多 7 人

#### Scenario: 合法人數成功更新
- **WHEN** 課程有 3 位已核准學員，講師將 maxCount 改為 6 並送出
- **THEN** 系統更新 maxCount，頁面刷新顯示新人數

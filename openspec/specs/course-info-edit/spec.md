# course-info-edit Specification

## Purpose
定義招生階段由授課老師（或管理者）編輯課程資訊（名稱／預計人數／截止日／開課日／備註）的行為與限制，包含每班最多 7 人與「不得低於已核准學員數」的人數規則。
## Requirements
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
編輯課程資訊時，`maxCount` 上限 SHALL 依全域設定 `class_max_capacity`（預設 7）決定，並依操作者身分於 server 端權威套用：
- 一般使用者（課程建立者）：SHALL 滿足 1 ≤ `maxCount` ≤ `class_max_capacity`。
- 管理者（`canAccessAdmin`）：SHALL 可將 `maxCount` 設為超過 `class_max_capacity`（仍受合理硬頂防呆）。
兩者皆 SHALL NOT 低於該課程當下已核准（approved）學員數。編輯介面提示 SHALL 反映其可用上限。課程詳情的「編輯課程資訊」入口 SHALL 對管理者顯示（不限課程建立者）。

#### Scenario: 老師超過上限被拒
- **WHEN** 課程建立者將 `maxCount` 改為超過 `class_max_capacity` 並送出
- **THEN** 系統拒絕並提示上限值

#### Scenario: 管理者可超過上限
- **WHEN** 管理者將某班 `maxCount` 設為超過 `class_max_capacity`（且不低於已核准學員數）
- **THEN** 更新成功

#### Scenario: 管理者可見編輯入口
- **WHEN** 管理者檢視非其建立的招生中課程詳情
- **THEN** 顯示「編輯課程資訊」入口，可調整該班人數

#### Scenario: 低於已核准學員數被拒
- **WHEN** 課程已有 5 位已核准學員，操作者將 `maxCount` 改為 4 並送出
- **THEN** 系統拒絕並提示人數不可低於已核准學員數（5）


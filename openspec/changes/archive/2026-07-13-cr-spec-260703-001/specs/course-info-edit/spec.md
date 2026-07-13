# course-info-edit Delta Specification

## RENAMED Requirements

- FROM: `### Requirement: 招生階段編輯課程資訊`
- TO: `### Requirement: 依課程狀態編輯課程資訊`

## MODIFIED Requirements

### Requirement: 依課程狀態編輯課程資訊
課程詳情頁 `/course/[id]` SHALL 在課程**未取消**（`cancelledAt = null`）且檢視者為**該課程授課老師（開課者本人）或管理者**時，提供「編輯課程資訊」入口。
可編輯欄位 SHALL 依課程當下狀態決定：
- **招生中**（`startedAt = null`、`completedAt = null`）：課程名稱、預計人數（maxCount）、邀請截止日、預計開課日、內部備註。
- **進行中**（`startedAt != null`、`completedAt = null`）：課程名稱、開始上課日期（`startedAt`）。
- **已結業**（`completedAt != null`）：課程名稱、開始上課日期（`startedAt`）、結業日期（`completedAt`）。

SHALL NOT 開放修改課程書本（`courseCatalogId`）。已取消課程或非授權者 SHALL NOT 看到編輯入口，且對應 server action SHALL 拒絕。
server action SHALL 以**資料庫當下狀態**（而非 client 宣稱）決定允許的欄位集，僅更新該狀態白名單內欄位。
日期驗證：開始上課日期 SHALL 為有效日期且不晚於伺服器當日（允許過去）；結業日期 SHALL 為有效日期、不晚於伺服器當日、且不早於該課程開始上課日期。修改班級結業日期 SHALL NOT 連動學員個人 `graduatedAt`。

#### Scenario: 招生中講師可編輯
- **WHEN** 授課老師於招生中課程開啟詳情頁
- **THEN** 顯示「編輯課程資訊」入口，可修改名稱／人數／截止日／開課日／備註

#### Scenario: 進行中可編輯名稱與開始日期
- **WHEN** 授課老師（或管理者）於進行中課程開啟編輯
- **THEN** 僅可修改課程名稱與開始上課日期；儲存後課程頁顯示新值

#### Scenario: 已結業可編輯名稱與兩個日期
- **WHEN** 授課老師（或管理者）於已結業課程開啟編輯
- **THEN** 僅可修改課程名稱、開始上課日期、結業日期；儲存後課程頁與結業資訊區塊顯示新值

#### Scenario: 結業日期早於開始日期被拒
- **WHEN** 已結業課程編輯時將結業日期設為早於開始上課日期並送出
- **THEN** 系統拒絕並提示結業日期不可早於開始上課日期

#### Scenario: 進行中送出結業日期欄位被忽略
- **WHEN** 進行中課程的編輯請求夾帶 `completedAt` 欄位
- **THEN** server action 不更新 `completedAt`（非該狀態白名單欄位）

#### Scenario: 已取消不可編輯
- **WHEN** 課程已取消
- **THEN** 不顯示編輯入口；若仍呼叫 server action，回傳失敗

#### Scenario: 非授權者不可編輯
- **WHEN** 非開課者且非管理者嘗試編輯
- **THEN** server action 回傳無權限

#### Scenario: 修改結業日期不連動學員個人結業日
- **WHEN** 管理者將已結業課程的結業日期由 2026/06/30 改為 2026/06/25
- **THEN** 班級 `completedAt` 更新，所有學員的 `graduatedAt` 維持原值

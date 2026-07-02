# learning-record-feedback Specification

## Purpose
TBD - created by archiving change cr-spec-260702-003. Update Purpose after archive.
## Requirements
### Requirement: 學習歷程回饋入口
系統 SHALL 於學員學習紀錄頁提供回饋入口「是否遺失您的學習歷程？請在這裡回饋」，供已登入學員開啟回饋表單。文案 SHALL 以 i18n key 取用（不寫死中文）。

#### Scenario: 學員看到回饋入口
- **WHEN** 已登入學員瀏覽自己的學習紀錄頁
- **THEN** 頁面顯示「是否遺失您的學習歷程？請在這裡回饋」入口
- **AND** 點擊後開啟回饋表單

### Requirement: 送出學習歷程回饋
學員 SHALL 能送出回饋，內容包含：回饋類別（`missing_record`／`wrong_teacher`／`not_graduated`）、老師名稱（自由文字）、學習課程（自課程目錄選擇）、選填備註。系統 SHALL 以 `status = pending` 建立 `LearningRecordFeedback`，`userId` 為送出者。

#### Scenario: 成功送出回饋
- **WHEN** 學員選擇類別、填老師名稱、選課程並送出
- **THEN** 系統建立一筆 `LearningRecordFeedback`（`status=pending`、`userId`＝該學員）
- **AND** 回傳成功訊息（toast）

#### Scenario: 必填未填時擋下
- **WHEN** 學員未選類別或未選課程即送出
- **THEN** 系統以欄位錯誤（`validation.*` key）阻擋，不建立資料

#### Scenario: 課程限自目錄選擇
- **WHEN** 學員填寫學習課程
- **THEN** 課程僅能自課程目錄（`CourseCatalog`：啟動靈人/豐盛/得勝）選擇，不接受自由文字課程

### Requirement: 本人可見課程結業狀態與一鍵回報
系統 SHALL 於學員**本人**的學習紀錄頁顯示各報名課程的個人結業狀態（已結業／未結業／進行中）；此狀態 SHALL 僅於本人視角顯示，SHALL NOT 公開給其他會員。對「未結業」課程，系統 SHALL 提供一鍵回報入口，開啟回饋表單並**預帶該課程與老師**。

#### Scenario: 未結業學員看見自己的狀態
- **WHEN** 學員於自己的學習紀錄頁檢視課程
- **THEN** 每筆報名課程顯示個人結業狀態徽章（已結業／未結業／進行中）

#### Scenario: 一鍵回報預帶課程與老師
- **WHEN** 學員對「未結業」課程點「這有誤？回報」
- **THEN** 開啟回饋表單，並預先帶入該課程與老師名稱

#### Scenario: 不公開給其他會員
- **WHEN** 其他會員瀏覽該學員的公開頁
- **THEN** 不顯示其未結業狀態

### Requirement: 查看自己的回饋狀態
學員 SHALL 能查看自己送出的回饋與其處理狀態（pending／approved／rejected），且 SHALL NOT 看到他人的回饋。

#### Scenario: 檢視自己的回饋
- **WHEN** 學員開啟回饋列表
- **THEN** 僅顯示該學員自己送出的回饋與狀態

#### Scenario: 處理完成後狀態更新
- **WHEN** 管理者已處理某筆回饋
- **THEN** 學員於回饋列表看到對應的 approved 或 rejected 狀態


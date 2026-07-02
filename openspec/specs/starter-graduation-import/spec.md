# starter-graduation-import Specification

## Purpose
TBD - created by archiving change cr-spec-260702-001. Update Purpose after archive.
## Requirements
### Requirement: 證書名單解析為結業判定來源
系統 SHALL 解析 `doc/已領取-啟動靈人證書.docx` 與 `doc/待製作-啟動靈人證書.docx`，將名單姓名對應到名冊（`roster.json`）的學員 key，作為「完成啟動靈人」的判定依據；此名單 SHALL NOT 用於建立 `CertificateProduction`（證書製作不在本能力範圍）。

#### Scenario: 由 docx 產生結業名單資料檔
- **WHEN** 執行 `build-graduation.mjs`
- **THEN** 系統讀取兩份 docx 的 `word/document.xml`，逐段落抽取姓名，並略過含「證書：」的標題列
- **AND** 輸出 `graduation.json`，含對應到名冊 key 的 `holderKeys` 與查無對應的 `unmatchedCertNames`

#### Scenario: 姓名比對採精確、簡繁與確認別名
- **WHEN** 比對一個證書姓名
- **THEN** 系統依序嘗試原字串、OpenCC 簡→繁轉換、與已確認別名（如 `李素貞`＝名冊 `李素真`）
- **AND** 任一命中即對應到該名冊 key，否則列入查無對應

### Requirement: 班級課程結業判定
系統 SHALL 對每個啟動靈人班級，依證書名單判定是否課程結業：班上若有至少一位學員在結業名單，該班 SHALL 標記課程結業（`completedAt`）且結業日為 2025/09/01；否則 SHALL 維持進行中（不設 `completedAt`）。

#### Scenario: 班上有結業者則課程結業
- **WHEN** 某啟動靈人班級的學員中至少一位在結業名單
- **THEN** 該班 `completedAt` 設為 2025/09/01
- **AND** 該班 `startedAt` 與學員 `joinedAt` 亦以 2025/09/01 為準（避免開課晚於結業）

#### Scenario: 班上無結業者維持進行中
- **WHEN** 某啟動靈人班級無任何學員在結業名單
- **THEN** 該班不設 `completedAt`，維持進行中狀態

### Requirement: 學員結業與未結業判定
在已結業的班級中，系統 SHALL 將名單內學員標記為已結業（`graduatedAt` = 2025/09/01），並將同班但不在名單的學員標記為未結業（`nonGraduateReason` = "other"）。進行中班級的學員 SHALL 僅為已核准報名、不設結業或未結業原因。

#### Scenario: 名單內學員已結業
- **WHEN** 學員在已結業班級且在結業名單
- **THEN** 其報名 `graduatedAt` 設為 2025/09/01

#### Scenario: 同班未在名單者標記未結業
- **WHEN** 學員在已結業班級但不在結業名單
- **THEN** 其報名 `nonGraduateReason` 設為 "other"，且不設 `graduatedAt`

### Requirement: 啟動靈人種子班全員結業
黃國倫啟動靈人種子班的成員為創班種子教師，系統 SHALL 將其全員標記已結業，結業日為 2025/03/08，不受證書名單限制。

#### Scenario: 種子班成員全部結業
- **WHEN** seed 建立黃國倫啟動靈人種子班
- **THEN** 班級 `completedAt` 與所有成員 `graduatedAt` 皆設為 2025/03/08

### Requirement: 查無名冊對應者不建立帳號
對於在證書名單但名冊查無對應的姓名，系統 SHALL NOT 建立帳號或歸入任何班級，僅 SHALL 記錄於 `graduation.json.unmatchedCertNames` 供後續處理。

#### Scenario: 查無對應者僅記錄
- **WHEN** 證書姓名經比對後仍無名冊對應
- **THEN** 該姓名列入 `unmatchedCertNames`
- **AND** seed 不為其建立 `User` 或報名


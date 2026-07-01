# admin-certificate-production Specification

## Purpose
TBD - created by archiving change cr-spec-260628-003. Update Purpose after archive.
## Requirements
### Requirement: 待製作證書清單
後台證書製作頁 SHALL 以「每人每階層一張」（`userId × courseCatalogId` 去重）呈現應製作的實體結業證書，來源為已結業報名（`InviteEnrollment.graduatedAt != null`），同人同階層跨多班僅計一張（取最新結業日）。每列 SHALL 顯示：學員顯示名稱與啟動編號、課程階層、結業日期、製作狀態、製作日期、製作管理者、備註。此頁 SHALL 僅限管理者（`canAccessAdmin`）存取。

#### Scenario: 依人×階層去重列出
- **WHEN** 某學員在同一課程階層有多筆已結業報名
- **THEN** 清單僅呈現一張該階層證書（結業日取最新一筆）

#### Scenario: 僅列已結業
- **WHEN** 某報名未結業（`graduatedAt` 為 null）
- **THEN** 不出現在待製作清單

#### Scenario: 非管理者不可存取
- **WHEN** 不具 `canAccessAdmin` 者存取證書製作頁
- **THEN** 拒絕存取

### Requirement: 標記已完成製作與還原
系統 SHALL 允許管理者將一張證書標記為「已完成製作」，記錄製作日期（當下時間）與製作管理者（操作者），並 SHALL 允許**還原**（取消完成，清除製作日期與製作管理者）。狀態以 `CertificateProduction.producedAt` 表示（有值＝已完成）；標記/還原以 `(userId, courseCatalogId)` upsert。還原 SHALL NOT 清除該證書備註。

#### Scenario: 標記已完成
- **WHEN** 管理者對某張未完成證書點「已完成製作」
- **THEN** 該證書 `producedAt` 設為當下時間、`producedById` 設為操作管理者，狀態轉為已完成

#### Scenario: 還原為未完成
- **WHEN** 管理者對某張已完成證書點「還原」
- **THEN** `producedAt` 與 `producedById` 清除，狀態轉回未完成，且備註保留

### Requirement: 未完成/已完成篩選
清單 SHALL 提供狀態篩選，**預設顯示未完成**（`producedAt` 為 null，含尚無製作紀錄者）；管理者 SHALL 可切換查詢已完成（`producedAt != null`）。

#### Scenario: 預設顯示未完成
- **WHEN** 管理者開啟證書製作頁未指定狀態
- **THEN** 僅顯示未完成的證書

#### Scenario: 查詢已完成
- **WHEN** 管理者切換為「已完成」
- **THEN** 僅顯示已完成的證書

### Requirement: 人名搜尋與分頁
清單 SHALL 支援以人名搜尋（比對學員顯示名/中文姓名等），並 SHALL 以每頁最多 30 筆分頁；搜尋與狀態篩選 SHALL 一併作用於分頁結果。

#### Scenario: 人名搜尋
- **WHEN** 管理者輸入人名關鍵字
- **THEN** 僅顯示姓名符合關鍵字的證書（仍受目前狀態篩選限制）

#### Scenario: 每頁 30 筆
- **WHEN** 符合條件的證書超過 30 筆
- **THEN** 每頁最多顯示 30 筆並提供翻頁

### Requirement: 證書備註
系統 SHALL 允許管理者對每張證書填寫/編輯備註（內部用途），以 `(userId, courseCatalogId)` upsert 至 `CertificateProduction.note`；空白 SHALL 存為 null。備註 SHALL 於清單該列顯示與編輯。

#### Scenario: 新增備註
- **WHEN** 管理者對某張證書輸入備註並儲存
- **THEN** 該證書 `note` 更新，清單重整後顯示

#### Scenario: 清空備註
- **WHEN** 管理者將備註清為空白並儲存
- **THEN** `note` 存為 null


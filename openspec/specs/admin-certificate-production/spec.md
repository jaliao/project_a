# admin-certificate-production Specification

## Purpose
TBD - created by archiving change cr-spec-260628-003. Update Purpose after archive.
## Requirements
### Requirement: 待製作證書清單
後台證書製作頁 SHALL 以「每人每階層一張」（`userId × courseCatalogId` 去重）呈現應製作的實體結業證書，來源為已結業報名（`InviteEnrollment.graduatedAt != null`），同人同階層跨多班僅計一張（取最新結業日）。清單 SHALL 以**卡片方式**呈現（每張證書一張卡片），行動裝置單欄、桌機多欄，不需橫向捲動。每張卡片 SHALL 顯示：學員**真實姓名**（中文 `realName` 與英文 `englishName` 並列，作為證書製作依據的主要名稱；僅缺其一則只列有填者）為主標題，**性別以 icon 呈現於姓名旁**（男／女／未指定各有對應 icon）；主標題下方 SHALL 依序以相同行距列出**啟動編號**、**顯示名稱**（輔助辨識）、**單位**（所屬教會：清單教會名或自填其他，未填顯示「—」）、**課程階層－結業日期**等欄位（中英文姓名已於主標題呈現，不重複列出），另顯示製作狀態、製作日期、製作管理者、備註。真實姓名中英文皆未填時 SHALL 顯示醒目警示（如「未填真實姓名」），但 SHALL NOT 阻擋標記完成等操作。此頁 SHALL 僅限管理者（`canAccessAdmin`）存取。

#### Scenario: 依人×階層去重列出
- **WHEN** 某學員在同一課程階層有多筆已結業報名
- **THEN** 清單僅呈現一張該階層證書（結業日取最新一筆）

#### Scenario: 僅列已結業
- **WHEN** 某報名未結業（`graduatedAt` 為 null）
- **THEN** 不出現在待製作清單

#### Scenario: 卡片同時顯示真實姓名與顯示名稱
- **WHEN** 管理者檢視證書清單中某學員（中文真實姓名、英文名稱與暱稱皆已填）
- **THEN** 該卡片以「中文真實姓名＋英文名稱」並列為主要名稱，並同時顯示其顯示名稱作輔助辨識

#### Scenario: 卡片顯示身分確認資訊
- **WHEN** 管理者檢視證書清單中某學員（已填性別與所屬教會）
- **THEN** 該卡片於姓名旁以 icon 顯示其性別，並於下方欄位列出單位（教會名或自填其他），協助確認身分

#### Scenario: 真實姓名未填警示
- **WHEN** 清單中某學員的 `realName` 與 `englishName` 皆為空
- **THEN** 該卡片顯示醒目的「未填真實姓名」警示，且標記完成等操作仍可執行

#### Scenario: 真實姓名僅填其一
- **WHEN** 清單中某學員僅填中文真實姓名（或僅填英文名稱）
- **THEN** 主要名稱僅顯示有填的那一個，不顯示未填警示

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
清單 SHALL 支援以人名搜尋，比對範圍 SHALL 涵蓋**真實姓名（中文 `realName`、英文 `englishName`，英文不分大小寫）**、顯示名稱與啟動編號，並 SHALL 以每頁最多 30 筆分頁；搜尋與狀態篩選 SHALL 一併作用於分頁結果。分頁導覽 SHALL 提供**頁碼按鈕**供管理者直接跳至任一頁（不限於上一頁／下一頁逐頁點擊），頁數較多時 SHALL 以省略號收合中段頁碼，並保留上一頁／下一頁箭頭。

#### Scenario: 以真實姓名搜尋
- **WHEN** 管理者輸入某學員中文真實姓名或英文名稱的關鍵字（即使與其暱稱不同）
- **THEN** 該學員的證書出現在結果中（仍受目前狀態篩選限制）

#### Scenario: 人名搜尋
- **WHEN** 管理者輸入人名關鍵字
- **THEN** 僅顯示真實姓名（中/英）、顯示名稱或啟動編號符合關鍵字的證書（仍受目前狀態篩選限制）

#### Scenario: 每頁 30 筆
- **WHEN** 符合條件的證書超過 30 筆
- **THEN** 每頁最多顯示 30 筆並提供翻頁

#### Scenario: 點擊頁碼直接跳頁
- **WHEN** 符合條件的證書超過 30 筆（共多頁），管理者點擊某個非目前頁的頁碼按鈕（例如目前在第 1 頁，點擊頁碼「5」）
- **THEN** 頁面導航至該頁碼對應的結果，不需逐頁點擊上一頁／下一頁；目前狀態篩選與搜尋關鍵字維持不變

#### Scenario: 總頁數不多時列出全部頁碼
- **WHEN** 總頁數為 7 頁以內
- **THEN** 頁碼按鈕列出全部頁碼，不顯示省略號

#### Scenario: 總頁數多時以省略號收合
- **WHEN** 總頁數超過 7 頁，且目前頁與頭尾頁距離超過視窗範圍
- **THEN** 頁碼按鈕僅顯示第 1 頁、最後一頁、目前頁前後各 1 頁，其餘以單一省略號標示，不逐頁列出

#### Scenario: 目前頁碼有明顯標示
- **WHEN** 管理者檢視分頁按鈕列
- **THEN** 目前所在頁碼的按鈕樣式與其他頁碼不同，可清楚辨識目前在第幾頁

### Requirement: 證書備註
系統 SHALL 允許管理者對每張證書填寫/編輯備註（內部用途），以 `(userId, courseCatalogId)` upsert 至 `CertificateProduction.note`；空白 SHALL 存為 null。備註 SHALL 於清單該列顯示與編輯。

#### Scenario: 新增備註
- **WHEN** 管理者對某張證書輸入備註並儲存
- **THEN** 該證書 `note` 更新，清單重整後顯示

#### Scenario: 清空備註
- **WHEN** 管理者將備註清為空白並儲存
- **THEN** `note` 存為 null

### Requirement: 證書卡片學員列使用會員文字元件
證書製作卡片原本純文字顯示的「啟動編號」列 SHALL 改為「學員」列，並以「會員文字元件」（見 `admin-member-tag`）呈現該學員的啟動編號與顯示名稱；點擊可展開完整會員標籤，提供檢視與傳訊息入口。

#### Scenario: 學員列顯示會員文字元件
- **WHEN** 管理者檢視證書製作清單中某張卡片
- **THEN** 卡片的「學員」列以底線文字顯示該學員的啟動編號＋顯示名稱

#### Scenario: 點擊學員列展開完整資訊
- **WHEN** 管理者點擊卡片「學員」列的文字
- **THEN** 彈出該學員的完整會員標籤，可點擊「檢視」開新分頁至會員詳情頁、點擊「訊息」開啟訊息 Drawer 聯繫


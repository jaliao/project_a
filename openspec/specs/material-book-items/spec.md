# material-book-items Specification

## Purpose
TBD - created by archiving change cr-spec-260701-003. Update Purpose after archive.
## Requirements
### Requirement: 教材逐本項目
教材以「逐本項目」表示：某課程中「已核准且選了版本（`materialChoice ≠ none`）」的每一筆報名，即為一個書本項目 `{ 學員, 書本名字, 版本(繁/簡) }`。系統 SHALL 由報名產生書本項目清單供老師/管理者檢視與指派。繁/簡本數 SHALL 由項目計數推導（`traditionalQty/simplifiedQty` 為推導值）。

#### Scenario: 由報名產生書本項目
- **WHEN** 某課程有 3 位已核准學員分別選 繁/繁/簡
- **THEN** 產生 3 個書本項目（各含學員、書本名字、版本），繁 2 / 簡 1

#### Scenario: 未選版本不產生項目
- **WHEN** 某報名 `materialChoice = none`
- **THEN** 不產生書本項目

### Requirement: 地址優先指派書本項目
多地址寄送 SHALL 採「先建地址、再指派書本」流程：先新增寄送地址（收件人＋門市/宅配，只填一次），再將書本項目指派至該地址（建立項目↔地址關聯 `MaterialShipmentItem`）。指派時 SHALL 快照書本名字與版本。每個地址的繁/簡本數 SHALL 由其已指派項目推導。

#### Scenario: 建立地址後指派書本
- **WHEN** 老師新增一個寄送地址，並勾選 2 個書本項目指派至該地址
- **THEN** 該地址關聯 2 個書本項目（含快照的書本名字＋版本），其繁/簡數量依項目推導

#### Scenario: 送出前需全部指派且不重複
- **WHEN** 多地址訂單送出時仍有書本項目未指派、或某項目被指派到多個地址
- **THEN** 阻擋送出並提示

#### Scenario: 快照不受學員事後改名影響
- **WHEN** 書本項目已指派後，學員修改自己的書本名字
- **THEN** 已建立訂單之地址項目仍顯示指派當下的快照名字

### Requirement: 單一地址亦以逐本項目呈現
每一筆教材訂單（含**單一地址**）SHALL 記錄其實際涵蓋的書本項目：訂單建立時，其涵蓋範圍＝當下**尚未被任何寄送地址指派**的書本項目（`getUnassignedBookItems`）。單一地址訂單 SHALL 亦建立一個寄送批次（`MaterialShipment`，鏡射該地址）並為每本書建立 `MaterialShipmentItem`（快照書本名字、版本、學員名稱）。訂單的書本清單 SHALL 取自其自身寄送批次之項目，使多筆先後寄送（多地址／單一地址）之書本歸屬明確、不混淆。

#### Scenario: 單一地址記錄其涵蓋書本
- **WHEN** 老師以單一地址申請寄送其餘教材
- **THEN** 系統建立一個寄送批次並為當下未指派的每本書建立項目（含學員名稱快照），該訂單書本清單即為這些項目

#### Scenario: 多筆單一寄送各自歸屬
- **WHEN** 同課程先後建立兩筆單一地址訂單（其間各有新學員加入）
- **THEN** 每筆訂單只包含其建立當下未指派的書本，不會互相混入

#### Scenario: 項目快照含學員名稱
- **WHEN** 書本項目被指派/建立
- **THEN** 一併快照學員名稱，供後台與列印顯示


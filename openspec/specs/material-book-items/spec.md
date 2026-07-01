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


## MODIFIED Requirements

### Requirement: 學員申購教材選版本與書本名字
學員申請參加課程並選擇教材版本（繁體／簡體／無須購買）時，若選了需購買的版本，SHALL 同時提供「書本名字」欄位，**預設帶入 中文名稱 → 英文名稱 → 匿名**，學員 SHALL 可自行編輯。書本名字 SHALL 存於 `InviteEnrollment.materialBookName`；送出為空白時採預設值。選「無須購買」時不需書本名字。

#### Scenario: 預設帶入書本名字
- **WHEN** 學員開啟申購並選擇繁體/簡體版本
- **THEN** 書本名字欄預帶「中文名稱（無則英文名稱，皆無則匿名）」，可編輯

#### Scenario: 自訂書本名字
- **WHEN** 學員修改書本名字並送出
- **THEN** `materialBookName` 存為所填值

#### Scenario: 留白採預設
- **WHEN** 學員清空書本名字並送出
- **THEN** `materialBookName` 存為預設（中文→英文→匿名）

#### Scenario: 無須購買不需名字
- **WHEN** 學員選「無須購買」
- **THEN** 不要求書本名字

## MODIFIED Requirements

### Requirement: 預設教會資料初始化
`prisma/seed.ts` SHALL 在執行時初始化四個預設教會：101、心欣、Kua、全福會，依序設定 `sortOrder` 為 1–4，`isActive = true`。使用 `upsert`（以 `name` 為唯一條件）確保幂等，重複執行不重複建立。

#### Scenario: 首次執行 seed
- **WHEN** `prisma/seed.ts` 在空資料庫執行
- **THEN** 建立四個教會：101（sortOrder=1）、心欣（sortOrder=2）、Kua（sortOrder=3）、全福會（sortOrder=4），所有 `isActive = true`

#### Scenario: 重複執行 seed（幂等）
- **WHEN** `prisma/seed.ts` 在已有教會資料的資料庫執行
- **THEN** 不重複建立，使用 upsert 更新 `sortOrder` 與 `isActive`，會員關聯不受影響

#### Scenario: 執行完成提示
- **WHEN** seed 完成教會資料初始化
- **THEN** 控制台輸出教會清單與對應 sortOrder

## ADDED Requirements

### Requirement: 管理者帳號更新
`prisma/seed.ts` 管理者 email SHALL 更新為 `101@iwillshare.org.tw`（原 `justin@blockcode.com.tw`），`spiritId` 保持 `PA000001`，`role = 'superadmin'`，`isTempPassword = true`。

#### Scenario: 首次執行 seed（管理者）
- **WHEN** 空資料庫執行 seed
- **THEN** 建立 email 為 `101@iwillshare.org.tw` 的 superadmin 帳號

#### Scenario: 重複執行（幂等）
- **WHEN** 管理者已改密碼後重新執行 seed
- **THEN** `passwordHash` 不被覆蓋（update 不含此欄位）

### Requirement: 20 位種子會員
`prisma/seed.ts` SHALL 建立 20 位種子會員（PA260001–PA260020），每位含 `realName`、`name`、`englishName`（部分）、`phone`、`gender`、`churchId`、`displayNameMode`。依下列順序排列，spiritId 對應序號：

| spiritId | realName | englishName | gender |
|----------|----------|-------------|--------|
| PA260001 | 黃國倫 | Gordon | male |
| PA260002 | 吳容銘 | Romen | male |
| PA260003 | — | Hilo | male |
| PA260004 | — | Joyce | female |
| PA260005 | 湯尼 | — | male |
| PA260006 | — | Johni | male |
| PA260007 | — | KT | male |
| PA260008 | 王明台 | — | male |
| PA260009–PA260013 | 隨機 | 隨機 | 隨機 |
| PA260014 | Justin | Justin | male |
| PA260015–PA260020 | 隨機 | 隨機 | 隨機 |

#### Scenario: 首次執行 seed（會員）
- **WHEN** 空資料庫執行 seed
- **THEN** 建立 20 位會員，spiritId 從 PA260001 至 PA260020，含電話、所屬教會

#### Scenario: spiritIdCounter 同步
- **WHEN** seed 完成後
- **THEN** `spiritIdCounter` 的 `seq` 同步至 20，避免後續自動核發與種子資料衝突

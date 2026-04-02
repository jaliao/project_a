## ADDED Requirements

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

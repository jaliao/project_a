## Why

每次重置資料庫（`make clean && make dev && make schema-update && make prisma-seed`）後，測試帳號都被標記為 `isTempPassword=true` 且缺少 `realName`／`phone`，導致登入後被強制走一次三步驟「第一次登入補填資料」流程才能進入系統。這拖慢 QA 測試節奏。本變更讓 seed 直接產出「已完成補填」的測試帳號，重置後即可登入測試。

## What Changes

- 於 `prisma/seed.ts` 明確建立 4 位測試學員帳號：`student1@test.com` ~ `student4@test.com`，密碼 `Student@1234`（沿用 `SEED_STUDENT_PASSWORD` 可覆寫），角色 `user`。
- 4 位測試學員與測試講師（`teacher@test.com`）皆預先完成「第一次登入補填」狀態：
  - `isTempPassword=false`（跳過 Step 1 設定密碼強制流程）
  - `realName`、`phone` 均已填寫（跳過 Step 2 與 profile-completion-guard 強制轉導）
  - 一併填妥 `nickname`、`gender`、`displayNameMode`、`spiritId`，使資料完整可直接使用
- 維持 seed 冪等性：重複執行不重置既有帳號資料／密碼。
- **BREAKING**（相對於既有 spec）：測試學員的 `isTempPassword` 由 `true` 改為 `false`，且不再需要手動補填。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `seed-test-accounts`: 4 位測試學員帳號的需求由「`isTempPassword=true`、僅含基本欄位」改為「預先完成第一次登入補填（`isTempPassword=false`，`realName`/`phone`/`nickname`/`gender`/`spiritId` 齊備），重置後可直接登入而不需走補填流程」。

## Impact

- `prisma/seed.ts`：新增 4 位測試學員區塊；調整測試講師帳號為已補填狀態。
- 受影響流程：`onboarding-wizard`（測試帳號不再進入）、`profile-completion-guard`（測試帳號不再被轉導）— 行為不變，僅測試資料狀態改變。
- 文件：依 CLAUDE.md 第 9 點同步檢查 `doc/` 操作手冊（本變更僅影響測試資料，預期手冊無實質流程異動，仍需確認）。
- `config/version.json` patch +1（apply 時）。

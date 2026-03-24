## Why

seed.ts 目前只建立 superadmin 帳號，缺少一般學員測試帳號，開發時無法模擬學員登入流程。增加 4 組設計好的學員帳號，讓前端、課程與邀請功能可以有真實使用者資料進行測試。

## What Changes

- 修改 `prisma/seed.ts`，在現有 superadmin 之外新增 4 位學員帳號
- 每位學員採用 `upsert` 確保冪等（重複執行不重複建立）
- 學員密碼預設為 `Student@1234`（可透過環境變數 `SEED_STUDENT_PASSWORD` 覆寫）
- 角色皆為 `user`，`isTempPassword: true`（首次登入須改密碼）

**學員資料設計：**

| # | email | realName | nickname | spiritId | phone |
|---|-------|----------|----------|----------|-------|
| 1 | student1@test.com | 陳志明 | 小明 | PA260001 | 0912-001-001 |
| 2 | student2@test.com | 林雅婷 | 婷婷 | PA260002 | 0923-002-002 |
| 3 | student3@test.com | 王建宏 | 阿宏 | PA260003 | 0934-003-003 |
| 4 | student4@test.com | 張淑惠 | 小惠 | PA260004 | 0956-004-004 |

## Capabilities

### New Capabilities
<!-- 無新 capability，僅修改開發工具腳本 -->

### Modified Capabilities
<!-- 無 spec 層級的行為變更 -->

## Impact

- `prisma/seed.ts` — 唯一修改檔案
- 執行 `make prisma-seed` 後資料庫會新增 4 位學員（本機開發環境）
- 不影響 migration、schema 或任何應用程式邏輯

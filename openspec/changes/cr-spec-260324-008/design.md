## Context

`prisma/seed.ts` 目前只建立 superadmin 帳號。開發環境缺少學員測試資料，無法驗證課程訂購、邀請流程等需要一般使用者的功能。此變更僅修改 seed 腳本，不觸及 schema 或應用程式邏輯。

## Goals / Non-Goals

**Goals:**
- 在 seed.ts 新增 4 位學員帳號，角色為 `user`
- 採用 `upsert` 確保冪等執行
- 支援透過環境變數 `SEED_STUDENT_PASSWORD` 覆寫預設密碼

**Non-Goals:**
- 不修改 schema 或 migration
- 不新增 admin 帳號
- 不影響 production seed 流程（seed 僅於開發環境執行）

## Decisions

**使用陣列迴圈批次 upsert**
每位學員資料定義為常數陣列，透過 `Promise.all` 並行執行 upsert，避免重複程式碼。替代方案（個別逐一 upsert）可讀性低、維護成本高。

**spiritId 從 PA260001 起算**
superadmin 的 spiritId 為 `PA000001`（特殊保留格式），學員使用當年度流水號 `PA260001~PA260004`，與計數器邏輯一致。

**isTempPassword: true**
測試帳號預設密碼為弱密碼，標記為臨時密碼強制首次變更，與系統安全策略一致。

## Risks / Trade-offs

- [spiritId 衝突] 若後續初始化流程也自動產生 PA260001，可能發生 unique constraint 衝突 → `upsert` where spiritId 時會更新而非報錯，風險低
- [密碼明文記錄] 預設密碼 `Student@1234` 寫在程式碼中 → 僅限開發環境，且有環境變數覆寫機制，可接受

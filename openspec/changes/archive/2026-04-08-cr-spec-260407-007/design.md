## Context

middleware 目前將 `isTempPassword=true` 的用戶導向 `/change-password`，完成後再跳到 Profile 頁。兩個頁面各自獨立，缺乏進度感與引導。`/change-password` 頁保留供已登入用戶（Profile 頁）使用，onboarding 走獨立路由。

## Goals / Non-Goals

**Goals:**
- 新增 `/onboarding` 三步驟 Wizard（設定密碼 → 基本資料 → 歡迎）
- middleware 將 `isTempPassword=true` 導向 `/onboarding`
- profile completion guard 排除 `/onboarding`
- Step 1 複用 `changeTempPassword` action（不另開 action）
- Step 2 複用現有 `updateProfile` 或新增輕量 action 只更新 `realName`/`phone`

**Non-Goals:**
- 不修改 `/change-password` 頁（保留給 Profile 頁已登入用戶）
- 不新增 DB 欄位（以 `isTempPassword=false && realName && phone` 判斷完成）
- Step 2 不要求全部欄位（commEmail、address 等可後填）

## Decisions

### D1：單頁 Wizard，步驟以 `useState` 管理
**決定**：`app/onboarding/onboarding-wizard.tsx` 為 Client Component，`step` state 控制顯示 Step 1/2/3。

**理由**：三步驟彼此依賴（Step 1 拿到 spiritId 才能進 Step 2），無需獨立 URL。避免 `/onboarding/password`、`/onboarding/profile` 多路由維護成本，也防止用戶直接跳步。

### D2：`app/onboarding/page.tsx` 為 Server Component，防止已完成 onboarding 的用戶重複進入
**決定**：page.tsx 讀取 session + DB，若 `isTempPassword=false && realName && phone` 則 `redirect('/dashboard')`。

**理由**：防止已完成用戶書籤回到 `/onboarding` 重跑流程。

### D3：Step 1 成功後由 Server Action 回傳 spiritId，Wizard 在 client 儲存
**決定**：`changeTempPassword` action 回傳 `{ success, spiritId, message }`，Wizard 存入 state 供 Step 2/3 使用。

**理由**：Step 2 更新 profile 需要 userId（透過 session 取得），Step 3 顯示靈人編號需要 spiritId。action 已能取得，直接回傳避免再次查詢。

### D4：Step 2 新增輕量 `completeOnboardingProfile` action
**決定**：新增 action，只更新 `realName` 與 `phone`，不影響其他欄位。

**理由**：現有 `updateProfile` 需完整表單資料，在 Wizard 語境中過重。輕量 action 語義清晰，Zod schema 只驗必要欄位。

### D5：版型採兩欄品牌樣式（lg 以上）
**決定**：與 `/login`、`/register`、`/change-password` 一致的兩欄版型，左側品牌區固定，右側顯示各步驟表單。

**理由**：統一視覺語言，品牌區左側可顯示步驟進度指示。

## Risks / Trade-offs

- **Wizard 狀態遺失（用戶重整）**：Step 1 完成後 `isTempPassword` 已設為 false，重整後 middleware 不再攔截，page.tsx server guard 視 `realName`/`phone` 是否填寫決定是否放行或留在 `/onboarding`。→ 可接受，Step 2 重填即可。
- **`/change-password` 路由不再是首次登入入口**：需確保 middleware 更新後舊書籤（`/change-password`）不影響已登入用戶；已登入且 `isTempPassword=false` 的用戶直接進 `/change-password` 不受影響。

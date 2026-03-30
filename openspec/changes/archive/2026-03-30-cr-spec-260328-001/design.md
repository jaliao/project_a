## Context

學員頁面（`app/(user)/user/[spiritId]/page.tsx`）目前身分標籤僅顯示一個 Badge，來源為 `user.learningLevel`（手動欄位）。頁面已查詢 `certificates`（`getMyCompletionCertificates`），但未用於標籤計算。

## Goals / Non-Goals

**Goals:**
- 身分標籤顯示多個 Badge（role 標籤 + 講師標籤）
- 標籤來源改為 `user.role` 與結業證書

**Non-Goals:**
- 不修改 `learningLevel` 欄位（保留，供其他功能使用）
- 不新增 DB 欄位或 API
- 不修改其他頁面的標籤顯示

## Decisions

### 1. 標籤計算在 Server Component 內完成
**選擇**: 直接在 `page.tsx` 計算 `identityTags: string[]` 陣列，傳入渲染
**理由**: 純 derive 邏輯，無需 Client Component，資料已在 server 端齊備。

### 2. 講師標籤來自 certificates（已有查詢）
**選擇**: 沿用 `getMyCompletionCertificates(user.id)` 回傳的 `courseLevel` 推導講師標籤
**理由**: 不需要額外查詢，`certificates` 已包含每等級最新結業紀錄。

### 3. 標籤順序：角色 → 講師（等級升序）
**選擇**: `['系統管理員', '啟動靈人 1 講師', '啟動靈人 2 講師', ...]`
**理由**: 角色標籤優先級較高，講師標籤依等級排序易於閱讀。

### 4. 新增 role 欄位至 prisma select
**選擇**: 在 `page.tsx` 的 `prisma.user.findUnique` select 補充 `role: true`
**理由**: 目前 select 未包含 role，需補充才能計算管理員標籤。

## Risks / Trade-offs

- 移除 `learningLevel` 標籤：原有「啟動靈人 N 學員」標籤消失 → 設計決策，講師標籤取代之
- `certificates` 查詢已依 courseLevel 去重，講師標籤不會重複 → 低風險

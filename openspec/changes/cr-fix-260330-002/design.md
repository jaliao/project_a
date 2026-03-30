## Context

開課精靈 Step 1 以 `hasQualification` 決定課程卡片是否可點擊。現行邏輯錯誤地以「是否完成先修課程」作為授課資格，應改為「是否結業該課程本身」。

**現行錯誤邏輯：**
```tsx
// step-1-course-card.tsx:42
const hasQualification =
  isAdmin || course.prerequisites.every((p) => graduatedCatalogIds.includes(p.id))
```

**正確邏輯：**
```tsx
const hasQualification =
  isAdmin || graduatedCatalogIds.includes(course.id)
```

`graduatedCatalogIds` 由 Server Component 透過 `getGraduatedCatalogIds(userId)` 查詢，已包含使用者所有結業課程的 id，資料正確，只需修正使用方式。

## Goals / Non-Goals

**Goals:**
- 修正授課資格判斷：結業哪門課 → 才能授課哪門課
- 通用邏輯，自動適用所有課程（靈人 1、2、3、4…）

**Non-Goals:**
- 不修改 `identityTags`（純 UI 顯示用，職責不同）
- 不修改資料查詢層（`getGraduatedCatalogIds` 邏輯正確）
- 不引入「身分」對應課程的映射表

## Decisions

**只修改 `hasQualification` 判斷條件，不改其他邏輯**

替代方案一（identity 路線）：透過 `identityTags` 字串比對課程名稱。
→ 棄用。需維護「身分字串 ↔ 課程 id」對應表，增加複雜度，且 `identityTags` 與 `graduatedCatalogIds` 資料來源相同。

替代方案二（後端加驗證）：在 Server Action 建立開課單時驗證資格。
→ 可補充，但前端 Step 1 的視覺鎖定仍需修正，兩者不互斥。

## Risks / Trade-offs

- **風險**：`graduatedCatalogIds` 若未正確傳入（空陣列），所有課程對 user 均不可點擊。
  → 緩解：資料來源 `getGraduatedCatalogIds` 邏輯不變，isAdmin bypass 保留，風險低。

- **Trade-off**：目前無後端授課資格二次驗證（Server Action 不檢查）。本次 fix 僅修前端鎖定，後端驗證可列為後續加強項目。

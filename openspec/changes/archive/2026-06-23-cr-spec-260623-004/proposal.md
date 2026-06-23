## Why

啟用 ESLint 9 flat config（cr 之前的 `eslint.config.mjs`）後，`react-hooks/purity` 規則標出 `components/course-session/course-session-form.tsx` 在 render 期間呼叫 `Date.now()`（不純函式），產生 2 個 error，並導致該元件被 React Compiler 跳過記憶化最佳化。修正後可取得 0-error 的 lint 基線，未來真正的錯誤才不會被既有雜訊淹沒。

## What Changes

- 將 `CourseSessionForm` 的 dev-only `defaultValues` 中 `new Date(Date.now() + …)` 兩處（`expiredAt`、`courseDate`）移出 render，改以 lazy 初始化（`useState` 初始化器）取得固定值。
- 將表單 `onSubmit` 由 `form.handleSubmit(onSubmit)`（render 期間呼叫）改為 `(e) => form.handleSubmit(onSubmit)(e)`（提交時才呼叫），消除修正 purity error 後浮現的 `react-hooks/refs` error（`onSubmit` 讀取 `titleDirtyRef`）。
- 使用者可見行為不變（僅 `isDev` 分支的表單預設值與提交時機，初值與提交行為意義相同）。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
（無 — 此為純實作品質修正，不變更任何 spec 層級需求或使用者可見行為）

## Impact

- **程式碼**：`components/course-session/course-session-form.tsx`（dev 預設日期移至 lazy 初始化器、`onSubmit` 改為提交時呼叫）。
- **品質**：`npm run lint` 由 2 errors → 0 errors（含修正 purity 後浮現的 `react-hooks/refs`）；該元件恢復 React Compiler 最佳化。
- **文件**：依規範更新 `config/version.json`（patch +1）與 `README-AI.md`；無手冊異動（無功能/UI 變更）。

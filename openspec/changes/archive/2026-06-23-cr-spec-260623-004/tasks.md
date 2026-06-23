## 1. 修正不純的預設值計算

- [x] 1.1 於 `components/course-session/course-session-form.tsx` 以 lazy `useState` 初始化器於 mount 計算一次 dev 預設日期（`expiredAt`、`courseDate`），確保 `expiredAt` 早於 `courseDate`
- [x] 1.2 將 `useForm` 的 `defaultValues` 改用上述穩定值，移除 render 期間的 `new Date(Date.now() + …)` 呼叫（保留 `isDev` 分支與空白預設值分支行為不變）
- [x] 1.3 將表單 `onSubmit` 改為 `(e) => form.handleSubmit(onSubmit)(e)`，消除修正 purity 後浮現的 `react-hooks/refs` error（行為等價）

## 2. 文件與版本

- [x] 2.1 `config/version.json` patch 版本號 +1
- [x] 2.2 依 `.ai-rules.md` 更新 `README-AI.md`（記錄本次 lint 基線修正；無資料模型/路由變更）

## 3. 驗證

- [x] 3.1 `npm run lint` 該檔 0 error（全專案 error 數由 2 → 0，含 purity 與後續浮現的 refs error）
- [x] 3.2 `npm run build` 通過（✓ Compiled successfully）
- [x] 3.3 開發環境開啟開課表單，確認預設帶入示範課程與日期（`expiredAt` 早於 `courseDate`）行為不變（待使用者於瀏覽器驗證）

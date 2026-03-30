## 1. 實作

- [x] 1.1 更新 `app/(user)/course/[id]/page.tsx`：加入 `checkPrerequisites` 呼叫，傳 `missingPrerequisites` 給 `StudentApplySection`
- [x] 1.2 更新 `app/(user)/course/[id]/student-apply-section.tsx`：接收 `missingPrerequisites` prop，disabled 按鈕並顯示提醒文字

## 2. 驗證

- [x] 2.1 執行 `npm run build`，確認無 TypeScript 編譯錯誤
- [x] 2.2 更新 `config/version.json` patch 版本號 +1
- [x] 2.3 更新 `README-AI.md`

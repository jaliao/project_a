## 申請按鈕先修資格前置檢查

### 驗收條件

1. **有缺少先修**：
   - 「申請參加」按鈕顯示但 `disabled`（視覺上不可點擊）
   - 按鈕附近顯示提醒文字，列出所有缺少的先修課程名稱（逐條列出）
   - 無法開啟 EnrollmentApplicationDialog

2. **無缺少先修**：
   - 行為與現有相同（按鈕可點擊，開啟 Dialog）

3. **已有申請 / 課程結業取消 / 報名截止**：
   - 不影響（現有提前 return 邏輯不變）

### 異動檔案

| 檔案 | 變更內容 |
|------|----------|
| `app/(user)/course/[id]/page.tsx` | 加入 `checkPrerequisites` 呼叫，傳 `missingPrerequisites` prop |
| `app/(user)/course/[id]/student-apply-section.tsx` | 接收 `missingPrerequisites`，disabled 按鈕 + 顯示提醒 |

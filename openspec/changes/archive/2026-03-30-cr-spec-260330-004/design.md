## 技術設計

### 資料流

1. `page.tsx`（Server Component）：在現有資料撈取時加入 `checkPrerequisites`
   ```typescript
   const missingPrereqs = (!isInstructor && currentUserId)
     ? await checkPrerequisites(currentUserId, courseSession.courseCatalogId)
     : []
   ```
2. 傳入 `StudentApplySection`：
   ```tsx
   <StudentApplySection
     ...
     missingPrerequisites={missingPrereqs}
   />
   ```

### UI 行為（StudentApplySection）

**有缺少先修（missingPrerequisites.length > 0）**：
```
[申請參加]  ← disabled，cursor-not-allowed

須先完成以下課程才可申請：
• 啟動靈人 1
• 啟動靈人 2
```

- 按鈕保持顯示但設 `disabled`
- 按鈕下方（或上方）顯示紅/琥珀色提醒區塊，列出缺少的先修課程名稱
- 不顯示 `EnrollmentApplicationDialog`（按鈕 disabled 即不可觸發）

**無缺少先修（missingPrerequisites.length === 0）**：維持現有行為（顯示可點擊按鈕）

### Props 異動

```typescript
// student-apply-section.tsx
type Props = {
  // ... 現有 props
  missingPrerequisites: { id: number; label: string }[]
}
```

### 邊界條件

- 未登入：`currentUserId` 為 null，`missingPrereqs = []`（未登入無法申請，由其他機制處理）
- 講師本人：`!isInstructor` 條件排除，不需計算
- 已有申請記錄：`StudentApplySection` 內部已提前 return，不顯示按鈕
- 課程已取消/結業：同上提前 return

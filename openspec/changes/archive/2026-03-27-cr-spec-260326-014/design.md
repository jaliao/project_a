## Context

目前課程結業為整門課一次性結業（`CourseInvite.completedAt`），所有已核准學員視同一起結業，沒有逐學員的結業記錄。學員頁面沒有結業證明展示，學習紀錄頁也沒有結業紀錄區塊。分享功能目前僅支援複製連結。

## Goals / Non-Goals

**Goals:**
- 結業時讓講師逐一選擇哪些學員通過，寫入 `InviteEnrollment.graduatedAt`
- 學員在多門課中同一等級只顯示一張結業證明（取最新一筆）
- 學習紀錄頁新增結業紀錄區塊
- 學員頁面新增學習紀錄預覽 + 跳轉連結
- 分享按鈕支援 Web Share API，不支援時 fallback 複製連結

**Non-Goals:**
- 不產生 PDF 或可下載的結業證書檔案
- 不修改 `CourseInvite.completedAt` 的判斷邏輯（課程結業仍以此為準）
- 不支援撤銷結業證明

## Decisions

### 1. 結業證明儲存於 `InviteEnrollment.graduatedAt`

**決定**：在 `InviteEnrollment` 新增 `graduatedAt DateTime?` 欄位，有值即代表該學員通過結業。

**理由**：結業證明與報名記錄綁定，語意清晰；不需要額外的 Certificate 資料表，減少複雜度。

**替代方案**：新增獨立 `CourseCompletion` 表 → 過度設計，目前需求不需要額外欄位。

### 2. 每個等級只顯示一張結業證明

**決定**：在查詢層以 `courseLevel` 去重，同等級取最新的 `graduatedAt`。

**理由**：學員若重複參加同等級課程，累積多筆結業記錄，UI 只需展示「是否擁有該等級結業證明」。

**實作**：`getMyCompletionCertificates(userId)` 查詢 `InviteEnrollment` where `graduatedAt IS NOT NULL`，group by `courseLevel` 取最新。

### 3. 分享按鈕用 Web Share API + clipboard fallback

**決定**：點擊分享時，若 `navigator.share` 可用則呼叫，否則複製連結並顯示 toast。

**理由**：手機端原生分享體驗更佳；桌機瀏覽器普遍不支援 Web Share API，fallback 保持可用性。

### 4. 結業 Dialog 在前端 client component 中處理勾選

**決定**：新增 `GraduationDialog` client component，列出已核准學員供講師勾選，送出後呼叫更新後的 `graduateCourse(inviteId, graduatedUserIds[])` action。

**理由**：勾選狀態為純 UI 互動，不需 server state；action 維持 server-side 驗證。

### 5. 學員頁面學習紀錄預覽固定最近 3 筆

**決定**：`/user/[spiritId]` 顯示最近 3 筆結業紀錄，超過 3 筆顯示「查看更多」連結至 `/learning`。

**理由**：與現有授課預覽（最近 3 筆）保持一致的 UI 模式。

## Risks / Trade-offs

- **結業 Dialog 學員清單過長** → 目前課程人數上限由 `maxCount` 控制，預期不超過 20 人，無需分頁
- **graduatedAt 回填問題** → 舊課程已結業但無 `graduatedAt` 記錄；migration 不自動回填，舊資料不顯示結業證明（預期行為）

## Migration Plan

1. `prisma/schema/course-invite.prisma` — `InviteEnrollment` 新增 `graduatedAt DateTime?`
2. `make schema-update name=add_graduation_to_enrollment`
3. 更新 `graduateCourse()` action 接收 `graduatedUserIds`，批次 update `graduatedAt`
4. 新增 `graduation-dialog.tsx` client component
5. 更新 `course-detail-actions.tsx` 改開 graduation dialog
6. 新增 `getMyCompletionCertificates()` data function
7. 更新學員頁面、學習紀錄頁
8. 更新分享按鈕元件

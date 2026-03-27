## Context

現有結業流程（`graduation-dialog.tsx`）以 Dialog 形式呈現，只有勾選結業學員功能。`graduateCourse` Server Action 接收 `graduatedUserIds: string[]`，並自動以當下時間設定 `completedAt`。缺少：
- 最後一堂課程日期（`completedAt` 應由講師指定，非系統時間）
- 未結業原因記錄（需新增 `InviteEnrollment.nonGraduateReason` 欄位）
- 送出前預覽確認步驟

## Goals / Non-Goals

**Goals:**
- 獨立結業頁面 `/course/[id]/graduate`，取代 Dialog
- 三步驟流程：填寫 → 預覽 → 送出
- 講師可指定最後一堂課程日期
- 未結業學員必須填寫原因（時間不足 / 其他）
- 資料庫新增 `nonGraduateReason` 欄位

**Non-Goals:**
- 不更改報名審核流程
- 不產生結業證書（另案處理）
- 不支援部分送出或草稿儲存

## Decisions

### 1. 獨立頁面取代 Dialog
**選擇**: `/course/[id]/graduate` 新頁面
**理由**: 表單欄位增多（日期、每位學員的原因下拉），Dialog 空間不足且行動裝置體驗差。
**替代方案**: 擴充現有 Dialog → 否決，Dialog 高度有限，預覽確認步驟需要全頁切換。

### 2. 三步驟以 React State 控制
**選擇**: Client Component 內用 `step: 'fill' | 'preview' | 'submit'` 狀態機
**理由**: 不需要多個路由，資料在同一元件記憶體中，步驟切換無需 loading。
**替代方案**: 三個獨立路由（/graduate/fill, /graduate/preview）→ 否決，URL 狀態管理複雜且無必要。

### 3. 未結業原因以 enum-like 字串儲存
**選擇**: `InviteEnrollment.nonGraduateReason String?`，值限定 `insufficient_time` / `other`
**理由**: 目前原因只有兩種，用字串欄位比新增 enum 更靈活（未來可擴充不需 migration）。
**替代方案**: Prisma enum `NonGraduateReason` → 否決，enum 擴充需 migration。

### 4. completedAt 改為講師指定日期
**選擇**: `graduateCourse` 接收 `lastCourseDate: Date`，用此值設定 `CourseInvite.completedAt`
**理由**: 原設計以操作時間為準，不反映實際最後一堂課的日期。
**影響**: 現有 action 介面需更新。

### 5. 結業狀態改為三元選擇
**選擇**: 每位學員有 `graduated: boolean` + `nonGraduateReason?: string`
**前端**: 預設全部「已結業」，取消勾選後顯示原因下拉
**資料**: `graduated: true` → `graduatedAt = lastCourseDate`；`graduated: false` → `nonGraduateReason` 必填

## Risks / Trade-offs

- **Migration 相容**: 新增 nullable `nonGraduateReason` 欄位，不影響現有資料 → 低風險
- **completedAt 語意改變**: 原為操作時間，現為講師指定日期，歷史資料不受影響（只有未來結業操作） → 可接受
- **Action 介面 BREAKING**: 現有 `graduateCourse(inviteId, graduatedUserIds[])` 需改為新介面。`graduation-dialog.tsx` 須同步移除或更新 → 已規劃移除

## Migration Plan

1. 新增 migration：`ALTER TABLE invite_enrollments ADD COLUMN non_graduate_reason TEXT`
2. 更新 Server Action 介面
3. 新增結業頁面
4. 課程詳情頁結業按鈕改為導向 `/course/[id]/graduate`
5. 移除 `graduation-dialog.tsx`

**Rollback**: 刪除新頁面，恢復舊 action 介面與 dialog（欄位 nullable 不影響回滾）。

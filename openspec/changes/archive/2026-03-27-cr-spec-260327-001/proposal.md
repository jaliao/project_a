## Why

現有結業流程以 Dialog 呈現，功能簡單（只有勾選結業學員），缺乏「最後一堂課程日期」欄位、未結業原因記錄，以及送出前的預覽確認步驟，導致講師無法完整記錄結業資訊。

## What Changes

- 將結業流程從 Dialog 改為獨立頁面（`/course/[id]/graduate`）
- 新增「最後一堂課程日期」欄位（對應 `CourseInvite.completedAt`）
- 學員結業狀態改為三選一：已結業 / 未結業（含原因下拉選單）
- 未結業原因下拉選單：`時間不足`、`其他`
- 新增送出前預覽確認步驟（填寫 → 預覽 → 送出）
- **BREAKING**: 結業表單新增 `InviteEnrollment.nonGraduateReason` 欄位（nullable 字串）

## Capabilities

### New Capabilities
- `course-graduation-page`: 講師填寫結業資訊的獨立頁面，含最後課程日期、每位學員結業狀態與未結業原因，支援填寫→預覽→送出三階段流程

### Modified Capabilities
- `course-invite`: 結業 Server Action 需擴充，接收最後課程日期與每位學員的結業狀態／未結業原因

## Impact

- **新增頁面**: `app/(user)/course/[id]/graduate/page.tsx`（取代 `graduation-dialog.tsx`）
- **修改 Schema**: `prisma/schema/course-invite.prisma` — `InviteEnrollment` 新增 `nonGraduateReason String?`
- **修改 Action**: `app/actions/course-invite.ts` — `graduateCourse` 接收新參數格式
- **修改課程詳情頁**: `app/(user)/course/[id]/page.tsx` — 結業按鈕改為導向新頁面
- **新增遷移**: 新增 `nonGraduateReason` 欄位的 migration

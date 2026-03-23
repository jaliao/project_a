## Context

目前 `CourseInvite.title` 為自由輸入文字，沒有課程類型的概念。`InviteEnrollment` 記錄學員報名，但無法區分「啟動靈人 1」或「啟動靈人 2」，也無先修驗證。系統沒有統一的學習紀錄頁面。

## Goals / Non-Goals

**Goals:**
- 以 config-driven 方式定義課程目錄（啟動靈人 1～4），含開放狀態與先修條件
- `CourseInvite` 綁定課程等級（enum），建立邀請時只能選 isActive 課程
- 加入 啟動靈人 2 邀請時驗證先修（已有 啟動靈人 1 InviteEnrollment）
- 新增 `/learning` 頁面顯示學習與授課紀錄

**Non-Goals:**
- 不做課程「完成」與「報名」的區分（InviteEnrollment.joinedAt 即視為完成）
- 不做 啟動靈人 3、4 的任何功能（僅在 config 標記 isActive: false）
- 不做跨課程的統計或排名

## Decisions

### 1. 課程定義：config-driven + Prisma enum

在 `config/course-catalog.ts` 定義課程元資料（label、isActive、prerequisiteLevel），同時在 Prisma schema 新增 `CourseLevel` enum（`level1 | level2 | level3 | level4`）。`CourseInvite` 新增 `courseLevel CourseLevel` 欄位。

**理由**：課程目錄是靜態設定，不需要 DB CRUD，config 檔更易維護。但 `courseLevel` 存進 DB 是為了讓查詢/過濾有型別安全。

### 2. CourseInvite.title 保留，並以 courseLevel label 自動填入

建立邀請時，`createInvite` 以 `COURSE_CATALOG[courseLevel].label` 作為 `title`（例如「啟動靈人 1」），不再由使用者輸入 title。前端表單移除 title 輸入欄，改為 courseLevel Select。

**理由**：維持 DB 的 `title` 欄位相容性（現有資料不受影響），同時讓課程名稱標準化。

### 3. 學習進度等級與先修驗證

**學習進度定義：**
- `level1` = 已以學員身份完成 啟動靈人 1（有對應 InviteEnrollment）
- `level2` = 已以學員身份完成 啟動靈人 2
- 依此類推

**先修規則（雙向）：**

| 動作 | 需要的學習進度 |
|------|----------------|
| 加入 啟動靈人 2 邀請（學員） | 已完成 level1 |
| 建立 啟動靈人 1 邀請（教師） | 已完成 level1 |
| 建立 啟動靈人 2 邀請（教師） | 已完成 level2 |

**實作方式：** 引入 helper `getUserLearningLevel(userId)` —— 查詢該使用者所有 InviteEnrollment，取最高的 courseLevel 數字作為 learningLevel（0 = 尚未完成任何課程）。

`joinInvite`：若邀請為 level2，驗證 `learningLevel >= 1`。
`createInvite`：驗證 `learningLevel >= courseLevel`（例如建立 level1 邀請需 learningLevel >= 1）。

**理由**：學習進度從 InviteEnrollment 動態推算，不需在 User 模型新增欄位，保持單一來源。

### 4. 學習紀錄：查詢現有 InviteEnrollment 與 CourseInvite

不新增 `LearningRecord` 模型。學習紀錄頁面（`/learning`）的資料來源：
- **已完成學習**：當前使用者的 `InviteEnrollment`（含 `invite.courseLevel`、`invite.title`、`invite.createdBy.realName`、`joinedAt`）
- **已完成授課**：當前使用者建立的 `CourseInvite`（含 `courseLevel`、`title`、`_count.enrollments`、`createdAt`）

**理由**：現有資料已足夠，避免資料重複。未來若需「課程未完成」狀態可再擴充。

### 5. 啟動靈人 3、4：config 標記 isActive: false，UI 不顯示

建立邀請的 courseLevel Select 只渲染 `isActive: true` 的課程。`/invite/[token]` 的 joinInvite 不需額外處理（不會有 level3/4 的邀請存在）。

## Risks / Trade-offs

- **現有 CourseInvite 無 courseLevel**：migration 時 `courseLevel` 需有預設值，設為 `level1`（最安全的 fallback）。
- **先修驗證可繞過**：管理員手動操作 DB 可繞過，可接受；系統內部路徑均有驗證。
- **教師建課先修**：新使用者（learningLevel = 0）無法建立任何課程邀請，需先以學員身份完成 level1。這是預期行為。

## Open Questions

（無）

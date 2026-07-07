# 紀錄開始上課日期＋課程時間顯示與編輯

## Why

目前「開始上課」按下後 `startedAt` 直接寫入當下系統時間，講師無法反映實際開課日，也沒有再確認的機會；課程頁看不到開始上課時間；課程一旦開始或結業後，名稱與時間完全鎖死，登錯了無法更正。

## What Changes

- 課程詳情頁「開始上課作業」區塊：「開始上課」按鈕上方新增**開始上課日期**欄位（date picker，預設今天）。
- 按下「開始上課」改為跳出**確認視窗**，顯示所選開課日期與已核准學員人數，講師確認後才執行。
- `startCourseSession` server action 增加日期參數：驗證後將所選日期寫入 `startedAt`；開課門檻驗證維持不變。
- 課程詳情頁基本資訊區塊**顯示開始上課日期**（已開始時）與**結業日期**（已結業時）。
- 「編輯課程資訊」由「僅招生中」擴充為**依課程狀態開放不同欄位**（授課老師或管理者）：
  - 招生中：維持現行（名稱／預計人數／截止日／預計開課日／備註）
  - **進行中**：課程名稱、開始上課日期
  - **已結業**：課程名稱、開始上課日期、結業日期
  - 已取消：維持不可編輯

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `course-status`: 「開始上課」流程需求變更——新增日期欄位與確認視窗；`startedAt` 由「按下當下時間」改為「講師所選開課日期」；server action 增加日期驗證。
- `course-info-edit`: 編輯課程資訊由「僅招生階段」改為依課程狀態（招生中／進行中／已結業）開放不同欄位集；已取消仍不可編輯。
- `course-session-detail`: 基本資訊區塊新增開始上課日期與結業日期顯示。

## Impact

- **程式碼**：
  - `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`（開始上課：日期欄位＋確認 Dialog）
  - `app/[locale]/(user)/course/[id]/page.tsx`（資訊區顯示兩個日期；編輯入口改依狀態顯示）
  - `components/course-session/edit-course-info-dialog.tsx`（依狀態切換欄位集）
  - `app/actions/course-invite.ts` `startCourseSession`（日期參數）；`app/actions/course-session.ts` `updateCourseInfo`（依狀態的欄位白名單與驗證）
  - `lib/schemas/course-session.ts`（進行中／已結業編輯欄位驗證）
- **資料模型**：沿用 `CourseInvite.startedAt` / `completedAt`，無 migration。
- **文件**：老師手冊「開始上課」與「編輯課程資訊」流程同步更新；version.json patch +1。
- **不影響**：開課門檻判定、課程狀態機、結業流程與學員個人 `graduatedAt`（改班級結業日期不連動學員個人結業日）。

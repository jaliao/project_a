## 1. EnrollmentApplicationDialog 課程資訊

- [x] 1.1 新增 props：`courseTitle: string`、`courseDate?: string | null`、`instructorName: string`
- [x] 1.2 Dialog 頂部（書籍選項上方）加入課程資訊區塊，顯示課程名稱、講師姓名、預計開課日期（無則不顯示）

## 2. StudentApplySection props 擴充

- [x] 2.1 新增 props：`courseTitle`、`courseDate`、`instructorName`，並傳入 `EnrollmentApplicationDialog`

## 3. page.tsx 傳入課程資訊

- [x] 3.1 修改 `app/(user)/course/[id]/page.tsx` — 傳入 `courseTitle`、`courseDate`（來自 courseOrder.courseDate 或 invite 本身）、`instructorName` 至 `StudentApplySection`

## 4. applyToCourse 通知講師

- [x] 4.1 修改 `app/actions/course-invite.ts` — `applyToCourse` 成功後，取 `invite.createdById` 為講師 userId，以 try/catch 呼叫 `createNotification`，通知標題「新申請通知」，內容含課程名稱與申請者名稱（fallback 到 email）

## 5. 版本與文件

- [x] 5.1 更新 `config/version.json` patch 版本號 +1
- [x] 5.2 更新 `README-AI.md` 反映申請流程完善

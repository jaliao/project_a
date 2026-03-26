## ADDED Requirements

### Requirement: 申請 Dialog 顯示課程資訊
系統 SHALL 在 `EnrollmentApplicationDialog` 頂部顯示課程名稱、預計開課日期（若有）、講師姓名，讓學員在選擇書籍前確認課程資訊。

#### Scenario: Dialog 顯示課程基本資訊
- **WHEN** 學員點擊「申請參加」開啟 Dialog
- **THEN** Dialog 頂部顯示課程名稱、預計開課日期、講師姓名

#### Scenario: 無預計開課日期時不顯示日期列
- **WHEN** 課程未設定預計開課日期（courseDate 為 null）
- **THEN** Dialog 不顯示日期列，其餘資訊正常顯示

### Requirement: 申請成功後通知講師
`applyToCourse` action 成功建立申請記錄後，系統 SHALL 以 `createNotification` 寫入一則 Inbox 通知給課程講師，通知標題為「新申請通知」，內容包含課程名稱與申請者名稱（或 email）。

#### Scenario: 申請成功寫入講師通知
- **WHEN** 學員成功呼叫 `applyToCourse`（建立 pending 記錄）
- **THEN** 系統寫入通知至講師的 Inbox，`notifications` 新增一筆記錄，`userId` 為講師的 userId

#### Scenario: 申請者無姓名時使用 email fallback
- **WHEN** 申請者的 `session.user.name` 為 null 或空字串
- **THEN** 通知內容改用 `session.user.email` 顯示申請者身份

#### Scenario: 通知寫入失敗不影響申請結果
- **WHEN** `createNotification` 發生例外（如 DB 連線失敗）
- **THEN** `applyToCourse` 仍回傳 `{ success: true, message: '申請已送出，等待講師審核' }`
- **THEN** 例外記錄至 console.error

### Requirement: 課程資訊 props 往下傳遞
`StudentApplySection` 和 `EnrollmentApplicationDialog` SHALL 接收課程資訊 props（courseTitle, courseDate, instructorName），由 `course/[id]/page.tsx` 傳入。

#### Scenario: page.tsx 傳入課程資訊
- **WHEN** 課程詳情頁渲染
- **THEN** `StudentApplySection` 收到 courseTitle、courseDate、instructorName
- **THEN** 這些 props 轉傳至 `EnrollmentApplicationDialog`

# enrollment-application Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for enrollment-application.
## Requirements
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

### Requirement: 學員申購教材選版本與書本名字
學員申請參加課程並選擇教材版本（繁體／簡體／無須購買）時，若選了需購買的版本，SHALL 同時提供「**教材所屬姓名**」欄位（欄位標籤 SHALL 為「教材所屬姓名」，標示必填），**預設帶入 中文名稱 → 英文名稱 → 匿名**，學員 SHALL 可自行編輯。該欄位為**必填**：送出時若為空白（trim 後），前端 SHALL 阻擋並提示；伺服端 `applyToCourse` SHALL 同步驗證並拒絕（不得自動補預設值）。欄位下方 SHALL 顯示聲明文字：「若因姓名誤植而要重新申請，需先自行吸收誤植之教材費」。姓名 SHALL 存於 `InviteEnrollment.materialBookName`（trim、上限 100 字）。選「無須購買」時不需教材所屬姓名。

#### Scenario: 預設帶入教材所屬姓名
- **WHEN** 學員開啟申購並選擇繁體/簡體版本
- **THEN** 教材所屬姓名欄預帶「中文名稱（無則英文名稱，皆無則匿名）」，可編輯

#### Scenario: 自訂教材所屬姓名
- **WHEN** 學員修改教材所屬姓名並送出
- **THEN** `materialBookName` 存為所填值（trim、上限 100 字）

#### Scenario: 空白送出被前端阻擋
- **WHEN** 學員選擇繁體/簡體版本、清空教材所屬姓名後送出
- **THEN** 前端顯示必填提示（toast），不呼叫伺服端

#### Scenario: 伺服端拒絕空白姓名
- **WHEN** `applyToCourse` 收到 `materialChoice ≠ none` 且姓名為空白（未填或 trim 後為空）的請求
- **THEN** 回傳 `{ success: false }` 與必填錯誤訊息，不建立申請記錄，亦不自動補預設值

#### Scenario: 顯示誤植費用聲明
- **WHEN** 學員選擇繁體/簡體版本（教材所屬姓名欄位顯示時）
- **THEN** 欄位下方顯示「若因姓名誤植而要重新申請，需先自行吸收誤植之教材費」

#### Scenario: 無須購買不需姓名
- **WHEN** 學員選「無須購買」
- **THEN** 不顯示、也不要求教材所屬姓名


## Why

老師（楊金津 PA261453）想將學員（林碧茹 PA261588）自班級移除，點擊「確認移除」後畫面出現錯誤，移除未成功執行（見 CR-SPEC-260818-003 附圖）。

比對現有程式（`app/actions/invite-students.ts` 的 `removeStudentFromInvite`）：教材寄送關聯（`MaterialShipmentItem`）已有守衛會回傳受控錯誤 toast，理論上不會產生整頁錯誤畫面；但函式內 `prisma.inviteEnrollment.findUnique`（取得報名）與 `prisma.user.findUnique`（取得操作者姓名，供稽核快照用）兩段查詢**位於外層 `try/catch` 之外**，任一查詢拋出例外時會變成未攔截的例外，導致 Next.js 顯示應用程式錯誤畫面而非受控 toast——這是目前唯一與程式碼相符、可解釋「畫面出錯」而非「訊息提示失敗」的路徑，需在測試環境還原正式環境資料庫備份、以實際資料重現後確認並修正。

同一需求單另提出兩項功能調整：移除學員時須說明原因（目前無任何原因欄位，稽核紀錄 `AdminActionLog.detail` 僅有系統自動產生的結業狀態摘要），以及移除成功後應通知管理者群組（目前 `createNotification` 僅支援單一收件人，無「通知全體管理者」的既有機制，見 `notify-on-action` capability）。

## What Changes

- **修正移除失敗**：將 `removeStudentFromInvite`（`app/actions/invite-students.ts`）中未受保護的兩段查詢（報名資料、操作者姓名）納入既有 try/catch 範圍內，任何例外皆回傳受控 `ActionResponse` 錯誤 toast，不再有可能拋出未攔截例外到前端；並補強 `console.error` 內容（含 `enrollmentId`、錯誤堆疊）以利未來排查。實際根本原因待以還原之正式環境資料庫備份於測試環境重現後確認、視情況調整修法。
- **移除原因（必填）**：`RemoveStudentButton`（`components/admin/invite-student-cells.tsx`）的確認 Dialog 新增必填原因文字欄位，未填寫時「確認移除」按鈕停用。`removeStudentFromInvite` 新增 `reason: string` 參數，伺服器端驗證非空白；原因寫入 `AdminActionLog.detail`（因 `InviteEnrollment` 為實體刪除，紀錄不存於報名資料本身，需靠稽核紀錄留存原因文字）。
- **移除成功通知管理者群組**：移除成功後，於既有交易外以 fire-and-forget（比照 `notify-on-action` 既有模式，try/catch 包覆、不阻塞主流程）查詢所有 `admin`／`superadmin` 身分使用者，逐一呼叫 `createNotification` 寫入站內訊息，內容含被移除學員姓名、班級名稱、操作者、原因。
- **正式環境操作限制（流程說明，非程式變更）**：本次修正僅於測試環境驗證；正式環境的實際刪除操作由使用者本人於正式環境親自執行，AI／開發者不代為在正式環境執行移除。

## Capabilities

### New Capabilities
（無，擴充既有 capability）

### Modified Capabilities
- `admin-enrollment-management`：「移除學員」需求新增必填原因欄位與例外處理受控化；新增「移除成功通知管理者群組」需求。

## Impact

- **Affected code**：
  - `app/actions/invite-students.ts`（`removeStudentFromInvite`：try/catch 範圍調整、新增 `reason` 參數與驗證、寫入 `AdminActionLog.detail`、fire-and-forget 通知管理者群組）
  - `components/admin/invite-student-cells.tsx`（`RemoveStudentButton`：確認 Dialog 新增必填原因 Textarea，未填寫停用確認按鈕）
  - `app/[locale]/(user)/course/[id]/approved-students-section.tsx`（若有呼叫端需一併傳遞 `reason`，需確認呼叫介面）
  - `lib/auth-roles.ts`（沿用既有 `canAccessAdmin`，查詢管理者群組時複用相同角色判斷邏輯）
- **Database**：無 schema 變更（`AdminActionLog.detail` 為既有欄位）。
- **Docs**：依 CLAUDE.md 第 9 點，需檢查並更新 `doc/管理者操作手冊.md`（移除學員新增必填原因說明）、`doc/老師手冊.md`（講師移除學員流程新增原因欄位說明）；`doc/學員手冊.md` 視是否需說明暫不修改。
- **Debug/Repro（非本次程式變更範圍，另行執行）**：於測試環境使用還原自正式環境的資料庫備份重現「確認移除」錯誤畫面，確認根本原因是否為本提案所修正的未受保護查詢例外，若非則需另行追查。
- **Dependencies**：無新增套件。

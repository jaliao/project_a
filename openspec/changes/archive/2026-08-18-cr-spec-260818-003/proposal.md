## Why

老師（楊金津 PA261453）想將學員（林碧茹 PA261588）自班級移除，點擊「確認移除」後畫面出現錯誤，移除未成功執行（見 CR-SPEC-260818-003 附圖）。

**根因已於測試環境以還原之正式環境資料庫實際重現並確認（2026-08-18）**：該筆報名（`invite_enrollments.id = 1640`）**確實已有一筆教材寄送紀錄**（`material_shipment_items.id = 94`，2026-08-03 建立）。`removeStudentFromInvite`（`app/actions/invite-students.ts`）既有邏輯會在偵測到 `_count.shipmentItems > 0` 時**主動拒絕移除**，回傳受控錯誤 toast「該報名已有教材寄送紀錄，請先至教材管理處理」——這不是未受控的程式例外或當機畫面，而是既有設計刻意擋下的正常提示；老師與客服誤將這則提示訊息理解為「系統出錯、移不掉」。

原提案（初版）假設根因是 `removeStudentFromInvite` 內兩段查詢未受 try/catch 保護導致未攔截例外，經以上實際重現後確認**並非本案例的實際成因**，予以修正：try/catch 擴大範圍仍是合理的一般性防禦強化（保留於本次變更中），但不是解決本案例的關鍵。

使用者確認後的最新業務決策（2026-08-18）：**移除學員不應再因為已有教材寄送紀錄而被擋下**——只要老師或管理者想移除，無論該學員是否已有教材寄送紀錄，都應該能夠移除，系統只需要確保移除原因被記錄、且管理者群組收到通知（若該生已有教材寄送紀錄，通知需一併註明，供管理者後續自行處理教材相關事宜，例如聯繫學員或作廢寄送）。

同一需求單另提出兩項功能調整：移除學員時須說明原因（目前無任何原因欄位，稽核紀錄 `AdminActionLog.detail` 僅有系統自動產生的結業狀態摘要），以及移除成功後應通知管理者群組（目前 `createNotification` 僅支援單一收件人，無「通知全體管理者」的既有機制，見 `notify-on-action` capability）。

## What Changes

- **移除教材寄送紀錄擋下移除的既有限制**：`removeStudentFromInvite` 移除 `_count.shipmentItems > 0` 時直接拒絕的邏輯。已有教材寄送紀錄的報名現在**仍可被移除**；`MaterialShipmentItem.enrollmentId` 依既有 FK（`ON DELETE SET NULL`）於刪除報名時自動清空關聯，寄送紀錄本身不受影響、不會遺失。
- **try/catch 防禦性強化（一般性改善，非本案例根因，但保留）**：將 `removeStudentFromInvite` 中未受保護的兩段查詢（報名資料、操作者姓名）納入既有 try/catch 範圍內，任何例外皆回傳受控 `ActionResponse` 錯誤 toast；並補強 `console.error` 內容（含 `enrollmentId`、錯誤堆疊）以利未來排查。
- **移除原因（必填）**：`RemoveStudentButton`（`components/admin/invite-student-cells.tsx`）的確認 Dialog 新增必填原因文字欄位，未填寫時「確認移除」按鈕停用。`removeStudentFromInvite` 新增 `reason: string` 參數，伺服器端驗證非空白；原因寫入 `AdminActionLog.detail`（因 `InviteEnrollment` 為實體刪除，紀錄不存於報名資料本身，需靠稽核紀錄留存原因文字）。
- **移除成功通知管理者群組**：移除成功後，於既有交易外以 fire-and-forget（比照 `notify-on-action` 既有模式，try/catch 包覆、不阻塞主流程）查詢所有 `admin`／`superadmin` 身分使用者，逐一呼叫 `createNotification` 寫入站內訊息，內容含被移除學員姓名、班級名稱、操作者、原因；**若該報名於移除當下已有教材寄送紀錄，通知內容 SHALL 額外註明，提醒管理者留意後續教材處理**。
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
- **Debug/Repro**：已於測試環境使用還原自正式環境的資料庫備份重現並確認根因（見上方 Why），無需另行追查。
- **Dependencies**：無新增套件。

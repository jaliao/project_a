## Context

`removeStudentFromInvite`（`app/actions/invite-students.ts:209-263`）目前流程：
1. `auth()` 驗證登入。
2. `prisma.inviteEnrollment.findUnique(...)` 取得報名資料（**不在 try/catch 內**）。
3. `canManageInvite` 權限檢查（`canAccessAdmin` 或 `invite.createdById === userId`）。
4. `_count.shipmentItems > 0` 守衛，回傳受控錯誤。
5. `prisma.user.findUnique(...)` 取得操作者姓名供稽核快照用（**不在 try/catch 內**）。
6. `try { prisma.$transaction(...) }` 內執行實體刪除 `InviteEnrollment` + 寫入 `AdminActionLog`。

第 2、5 步驟的查詢位於外層 try/catch 之外——只要其中任一查詢拋出例外（連線瞬斷、逾時等），例外會直接從 Server Action 拋出到呼叫端（`RemoveStudentButton.handleRemove`，`components/admin/invite-student-cells.tsx:238-248`），該處只用 `await` + 一般 `if (res.success)` 判斷、**沒有外層 try/catch**，未捕捉的 rejection 會讓 Next.js 顯示應用程式錯誤畫面（`app/global-error.tsx` 或就近 error boundary），而非目前設計中預期的 toast 提示。這是唯一與現有程式碼邏輯吻合、可解釋「畫面出錯」而非「toast 顯示移除失敗」的路徑。

教材寄送關聯（`MaterialShipmentItem.enrollmentId` FK，`prisma/schema/course-order.prisma:165-166`，預設 `RESTRICT`）是唯一指向 `InviteEnrollment` 的外部 FK，且已於第 4 步驟預先檢查並受控處理，不會是造成未受控例外的路徑。

## Goals / Non-Goals

**Goals:**
- 將 `removeStudentFromInvite` 中所有可能拋例外的資料庫查詢統一納入 try/catch，任何失敗情境一律回傳受控 `ActionResponse`，前端一律以 toast 呈現、不再出現未受控錯誤畫面。
- 移除學員須填寫必填原因，原因需可稽核（寫入 `AdminActionLog.detail`）。
- 移除成功後通知所有 `admin`／`superadmin` 身分使用者（新增「廣播給角色群組」的通知寫入模式，比照 `notify-on-action` 既有 fire-and-forget 慣例）。

**Non-Goals:**
- 不在本次變更新增「通知任一角色群組」的通用共用函數／capability；先以 `removeStudentFromInvite` 內就地實作（查詢 admin/superadmin 使用者 + 迴圈呼叫既有 `createNotification`），是否需要抽成共用 helper 待未來有第二個使用情境時再評估（避免過早抽象）。
- 不新增 `InviteEnrollment` 的原因欄位——因移除為實體刪除，刪除後該筆記錄本身不存在，原因僅能、也應該寫入不受刪除影響的 `AdminActionLog`。
- 不變更正式環境操作方式——正式環境的實際移除仍由使用者本人在正式環境操作介面上執行；本次變更不新增、也不使用任何直接對正式環境資料庫寫入的工具或腳本。
- 不處理「非未受控例外」造成的其他潛在移除失敗原因——若測試環境以還原之正式資料重現後發現實際根因並非本次修正的例外路徑，需另開 CR 追查，不在本次範圍內硬猜其他成因。

## Decisions

1. **try/catch 範圍擴大到涵蓋第 2、5 步驟查詢，而非個別包裝**
   將原本只包住 `$transaction` 的 `try { ... } catch (err) { return { success:false, message:'移除失敗，請稍後再試' } }` 往前擴大，一併涵蓋 `inviteEnrollment.findUnique` 與 `user.findUnique`。理由：這兩段查詢失敗的使用者體驗（toast「移除失敗，請稍後再試」）與交易失敗一致，不需要區分不同錯誤訊息；統一处理可避免遺漏其他未來新增查詢時重蹈覆轍。`console.error` 訊息加上 `enrollmentId` 與所在步驟，方便日後由 log 判斷失敗發生在哪一段。

2. **原因欄位為必填，寫入 `AdminActionLog.detail`、不新增欄位**
   `AdminActionLog.detail`（`prisma/schema/admin-log.prisma:30`）原本用於系統自動產生的摘要（如「移除已結業報名（結業 2025/09/01）」）。改為：`detail` 前段保留原有系統摘要，後接「；原因：{使用者填寫文字}」。伺服器端驗證 `reason.trim().length > 0`，否則回傳欄位錯誤 `{ success: false, errors: { reason: ['請填寫移除原因'] } }`，UI 對應顯示 `<FieldError>`；前端 Dialog 亦於原因欄位為空時停用「確認移除」按鈕（雙重防呆，比照既有人數上限等模式）。

3. **通知管理者群組：查詢角色後迴圈呼叫既有 `createNotification`，fire-and-forget**
   沿用 `notify-on-action` capability 既有規範（`app/actions/notification.ts:59-70` 的 `createNotification(userId, title, body)`，try/catch 包覆、不阻塞主流程、失敗僅 `console.error`）。新增邏輯：交易成功後，`prisma.user.findMany({ where: { roles: { hasSome: ['admin', 'superadmin'] } }, select: { id: true } })`，對每個結果呼叫 `createNotification`，title 固定為「學員移除通知」，body 包含班級名稱、被移除學員姓名、操作者姓名、移除原因。與交易本身分離（交易只做刪除 + 稽核紀錄），符合現有「通知寫入失敗不影響主操作結果」的既有規範，不需要因為要通知多人而改變交易邊界。

4. **正式環境根因驗證為實作階段任務，非本設計文件預先假設**
   本設計文件提出的「try/catch 範圍」修正是唯一與現有程式碼邏輯吻合的可疑點，但畫面實際顯示內容尚未經螢幕截圖以外的方式確認。實作階段（`/opsx:apply`）需先於測試環境還原正式環境資料庫備份、以受影響的老師／學員帳號實際重現操作流程，確認例外訊息與本設計推測相符後才視為修正完成；若重現後例外堆疊與本設計不符，需回頭調整本 change 的 tasks 而非直接視為已解決。

## Risks / Trade-offs

- **[風險] try/catch 擴大範圍後，若查詢本身邏輯有誤（如 `enrollmentId` 不存在的合法情境），會被籠統當成系統錯誤而非「找不到此報名」的既有訊息** → 緩解：`findUnique` 回傳 `null` 的分支（`if (!enrollment) return {...}`）維持在 try/catch 內、以正常回傳處理，不受影響；try/catch 只攔截查詢本身拋出的例外（連線層級），不改變既有的「查無資料」業務邏輯分支。
- **[風險] 通知管理者群組人數若未來成長，逐一 `createNotification` 的迴圈延遲可能增加** → 可接受：目前管理者人數極少（個位數），且為 fire-and-forget、不阻塞主操作回應。
- **[風險] 本次修正的根因推測若與測試環境重現結果不符** → 已於 Decision 4 訂出驗證流程，實作階段須先重現確認，不可跳過直接視為修正完成。

## Migration Plan

1. `app/actions/invite-students.ts`：擴大 try/catch 範圍、新增 `reason` 參數與驗證、寫入 `AdminActionLog.detail`、交易後 fire-and-forget 通知管理者群組。
2. `components/admin/invite-student-cells.tsx`：`RemoveStudentButton` 確認 Dialog 新增必填原因 Textarea，空白時停用確認按鈕，`handleRemove` 傳入 `reason`。
3. 於測試環境還原正式環境資料庫備份，以老師（PA261453）／學員（PA261588）實際情境重現原始錯誤畫面，驗證修正後改為正常 toast 流程。
4. `npm run lint` + `npm run build`。
5. 依 CLAUDE.md 規範同步 `doc/管理者操作手冊.md`／`doc/老師手冊.md`、`config/version.json` patch 版號。

**Rollback：** 純程式碼變更（Server Action 邏輯 + UI），無 schema 變更，可直接 revert commit，不涉及資料回填。

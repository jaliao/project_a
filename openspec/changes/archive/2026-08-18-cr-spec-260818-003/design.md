## Context

`removeStudentFromInvite`（`app/actions/invite-students.ts:209-263`）修正前流程：
1. `auth()` 驗證登入。
2. `prisma.inviteEnrollment.findUnique(...)` 取得報名資料（**不在 try/catch 內**）。
3. `canManageInvite` 權限檢查（`canAccessAdmin` 或 `invite.createdById === userId`）。
4. `_count.shipmentItems > 0` 守衛，回傳受控錯誤「該報名已有教材寄送紀錄，請先至教材管理處理」。
5. `prisma.user.findUnique(...)` 取得操作者姓名供稽核快照用（**不在 try/catch 內**）。
6. `try { prisma.$transaction(...) }` 內執行實體刪除 `InviteEnrollment` + 寫入 `AdminActionLog`。

**根因已於 2026-08-18 在測試環境以還原之正式環境資料庫實際查證**：老師（PA261453）欲移除的學員（PA261588）於楊金津班級的報名（`invite_enrollments.id = 1640`）**確實有一筆教材寄送紀錄**（`material_shipment_items.id = 94`）。因此她點擊「確認移除」時，實際執行到的是第 4 步驟的既有守衛，回傳的是**正常的受控 toast**，並非未受控例外或應用程式錯誤畫面。老師與客服（黃小鳥）把這則業務提示訊息誤認為系統故障。

第 2、5 步驟查詢位於 try/catch 之外一事仍然存在（連線瞬斷等情境下確實可能讓未攔截例外洩漏到前端），本次變更仍一併修正（防禦性強化），但**並非**本案例的實際成因，不應在文件中繼續當作本案例的根因描述。

**FK 行為更正**：原設計文件誤述 `MaterialShipmentItem.enrollmentId`（`prisma/schema/course-order.prisma:165-166`）FK 為預設 `RESTRICT`；實際查證 schema 為 `ON DELETE SET NULL`。這代表就算移除當下已有教材寄送紀錄，資料庫層面本來就不會擋下刪除（會自動把該筆寄送項目的 `enrollmentId` 設為 null，寄送紀錄本體保留）——之前擋下移除的，完全是應用層第 4 步驟的手動檢查，不是 DB 約束。此更正不影響最終決策（見下方 Decision 1），但更正文件避免誤導未來維護者。

**業務決策更新（使用者於 2026-08-18 確認）**：移除學員不應再因為已有教材寄送紀錄而被擋下——只要老師或管理者確認要移除，無論該學員是否已有教材寄送紀錄，都應該能移除；系統只需確保移除原因被記錄、且管理者群組收到通知（若該生已有教材寄送紀錄，通知需一併註明）。

## Goals / Non-Goals

**Goals:**
- 移除學員不再因既有教材寄送紀錄而被擋下；有教材寄送紀錄的報名一樣可以被移除。
- 將 `removeStudentFromInvite` 中所有可能拋例外的資料庫查詢統一納入 try/catch，任何失敗情境一律回傳受控 `ActionResponse`，前端一律以 toast 呈現、不再出現未受控錯誤畫面（一般性防禦強化）。
- 移除學員須填寫必填原因，原因需可稽核（寫入 `AdminActionLog.detail`）。
- 移除成功後通知所有 `admin`／`superadmin` 身分使用者（新增「廣播給角色群組」的通知寫入模式，比照 `notify-on-action` 既有 fire-and-forget 慣例）；若該報名有教材寄送紀錄，通知內容需額外註明。

**Non-Goals:**
- 不自動處理已存在的教材寄送紀錄（例如自動通知物流取消、自動標記寄送狀態）——移除後該寄送紀錄本身保留不變（FK `ON DELETE SET NULL` 僅清空 `enrollmentId` 關聯），後續如何處理由管理者收到通知後自行判斷，不在本次程式邏輯範圍內。
- 不在本次變更新增「通知任一角色群組」的通用共用函數／capability；先以 `removeStudentFromInvite` 內就地實作（查詢 admin/superadmin 使用者 + 迴圈呼叫既有 `createNotification`），是否需要抽成共用 helper 待未來有第二個使用情境時再評估（避免過早抽象）。
- 不新增 `InviteEnrollment` 的原因欄位——因移除為實體刪除，刪除後該筆記錄本身不存在，原因僅能、也應該寫入不受刪除影響的 `AdminActionLog`。
- 不變更正式環境操作方式——正式環境的實際移除仍由使用者本人在正式環境操作介面上執行；本次變更不新增、也不使用任何直接對正式環境資料庫寫入的工具或腳本。

## Decisions

0. **直接移除第 4 步驟的教材寄送紀錄擋下邏輯，不改成警示後仍可繼續（而是直接不擋）**
   使用者明確表示「不管他有沒有教材，只要通知管理者就可以了」——即不需要中間的二次確認/警示步驟，直接允許移除。移除該段 `if (enrollment._count.shipmentItems > 0) return {...}` 判斷；改為在移除成功、寫入 `AdminActionLog` 與通知管理者的內容中註明「該報名於移除時已有教材寄送紀錄」（沿用移除前已查出的 `_count.shipmentItems` 判斷值，不需要額外查詢）。資料庫層面本來就是 `ON DELETE SET NULL`（見 Context 更正），移除報名不會連帶刪除或損毀 `MaterialShipmentItem` 紀錄本身，僅該筆紀錄的 `enrollmentId` 會被設為 null，寄送歷史仍查得到（只是不再關聯到某筆報名）。

1. **try/catch 範圍擴大到涵蓋第 2、5 步驟查詢，而非個別包裝**
   將原本只包住 `$transaction` 的 `try { ... } catch (err) { return { success:false, message:'移除失敗，請稍後再試' } }` 往前擴大，一併涵蓋 `inviteEnrollment.findUnique` 與 `user.findUnique`。理由：這兩段查詢失敗的使用者體驗（toast「移除失敗，請稍後再試」）與交易失敗一致，不需要區分不同錯誤訊息；統一处理可避免遺漏其他未來新增查詢時重蹈覆轍。`console.error` 訊息加上 `enrollmentId` 與所在步驟，方便日後由 log 判斷失敗發生在哪一段。

2. **原因欄位為必填，寫入 `AdminActionLog.detail`、不新增欄位**
   `AdminActionLog.detail`（`prisma/schema/admin-log.prisma:30`）原本用於系統自動產生的摘要（如「移除已結業報名（結業 2025/09/01）」）。改為：`detail` 前段保留原有系統摘要，後接「；原因：{使用者填寫文字}」。伺服器端驗證 `reason.trim().length > 0`，否則回傳欄位錯誤 `{ success: false, errors: { reason: ['請填寫移除原因'] } }`，UI 對應顯示 `<FieldError>`；前端 Dialog 亦於原因欄位為空時停用「確認移除」按鈕（雙重防呆，比照既有人數上限等模式）。

3. **通知管理者群組：查詢角色後迴圈呼叫既有 `createNotification`，fire-and-forget，內容含教材寄送提醒**
   沿用 `notify-on-action` capability 既有規範（`app/actions/notification.ts:59-70` 的 `createNotification(userId, title, body)`，try/catch 包覆、不阻塞主流程、失敗僅 `console.error`）。新增邏輯：交易成功後，`prisma.user.findMany({ where: { roles: { hasSome: ['admin', 'superadmin'] } }, select: { id: true } })`，對每個結果呼叫 `createNotification`，title 固定為「學員移除通知」，body 包含班級名稱、被移除學員姓名、操作者姓名、移除原因；若移除時 `_count.shipmentItems > 0`，body 額外附加一行提醒（例如「該學員已有教材寄送紀錄，請留意後續處理」）。與交易本身分離（交易只做刪除 + 稽核紀錄），符合現有「通知寫入失敗不影響主操作結果」的既有規範，不需要因為要通知多人而改變交易邊界。

4. **根因已於實作階段實際查證確認（非預先假設）**
   2026-08-18 於測試環境以還原之正式環境資料庫備份、用老師（PA261453）／學員（PA261588）的真實報名紀錄（`invite_enrollments.id = 1640`）直接查詢，確認該報名有教材寄送紀錄（`material_shipment_items.id = 94`），命中既有守衛而非未受控例外——本設計文件與 proposal 已依此更新根因描述（見 Context）。try/catch 擴大範圍仍保留為一般性防禦強化，但不再宣稱是本案例的根因；移除教材寄送擋下邏輯（Decision 0）才是解決本案例的實際變更。

## Risks / Trade-offs

- **[風險] 移除教材寄送擋下後，管理者可能忽略通知、未後續處理已寄送的教材** → 可接受：使用者已明確要求「只要通知管理者就可以」，教材本身的後續處理（退回、作廢、聯繫學員）屬既有教材管理功能範圍，不在本次變更程式邏輯內；通知內容已明確註明教材寄送狀態，降低被忽略的機率。
- **[風險] try/catch 擴大範圍後，若查詢本身邏輯有誤（如 `enrollmentId` 不存在的合法情境），會被籠統當成系統錯誤而非「找不到此報名」的既有訊息** → 緩解：`findUnique` 回傳 `null` 的分支（`if (!enrollment) return {...}`）維持在 try/catch 內、以正常回傳處理，不受影響；try/catch 只攔截查詢本身拋出的例外（連線層級），不改變既有的「查無資料」業務邏輯分支。
- **[風險] 通知管理者群組人數若未來成長，逐一 `createNotification` 的迴圈延遲可能增加** → 可接受：目前管理者人數極少（個位數），且為 fire-and-forget、不阻塞主操作回應。

## Migration Plan

1. `app/actions/invite-students.ts`：移除教材寄送擋下判斷、擴大 try/catch 範圍、新增 `reason` 參數與驗證、寫入 `AdminActionLog.detail`、交易後 fire-and-forget 通知管理者群組（含教材寄送提醒）。
2. `components/admin/invite-student-cells.tsx`：`RemoveStudentButton` 確認 Dialog 新增必填原因 Textarea，空白時停用確認按鈕，`handleRemove` 傳入 `reason`；移除「有教材寄送紀錄」的擋下提示文字，改為一般提醒（若有教材寄送紀錄仍可繼續，僅顯示提醒文字）。
3. 於測試環境（已還原正式環境資料庫備份）以老師（PA261453）／學員（PA261588）實際情境驗證：有教材寄送紀錄的報名可正常移除、原因必填、管理者收到含教材提醒的通知。
4. `npm run lint` + `npm run build`。
5. 依 CLAUDE.md 規範同步 `doc/管理者操作手冊.md`／`doc/老師手冊.md`、`config/version.json` patch 版號。

**Rollback：** 純程式碼變更（Server Action 邏輯 + UI），無 schema 變更，可直接 revert commit，不涉及資料回填。

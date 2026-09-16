## Context

`InviteEnrollment.materialChoice`（`none/traditional/simplified/english`）目前只有一個寫入入口對學員本人開放：`applyToCourse`（`app/actions/course-invite.ts`，學員自行申請時透過 `EnrollmentApplicationDialog` 選擇並送出，建立 `status=pending` 報名）。老師直接「新增學員」（`addStudentToInvite`）建立的報名一開始就是 `status=approved`，且未帶入 `materialChoice`，因而落到 Prisma `@default(none)`。前端 `student-apply-section.tsx` 又以「`myEnrollment` 是否存在」決定要不要渲染申請按鈕／Dialog，approved 狀態一律視為「流程已結束」，導致老師代加入的學員完全沒有管道選擇或修改教材。

## Goals / Non-Goals

- Goals：讓老師代加入的學員預設視為「需要繁體教材」，並讓學員本人在已核准後仍能檢視/變更自己的教材選擇，直到該班教材申請被講師鎖定（finalize）為止。
- Non-Goals：不改變教材選擇的資料模型（沿用既有 `MaterialChoice` enum 與 `InviteEnrollment` 欄位）；不新增後台審核教材變更的流程；不處理「老師/管理者代學生變更教材」（此需求僅涵蓋學員本人操作）。

## Decisions

### 1. 文案調整為單純 i18n key 值變更
`course.material.none`／`course.enroll.noneDesc` 只有 `EnrollmentApplicationDialog` 一處使用（已於調查階段確認無其他引用），直接改 key 值，三語系（zh-TW 來源、en 翻譯、zh-CN 以 `npm run gen:zh-cn` 重新產生）同步更新，不需要新增 key。

### 2. 教材選擇預設值：只在「建立當下」寫入，不改 DB 層 `@default`
- **`addStudentToInvite`**：依該學員是否「上過課」決定預設值——查詢該 `userId` 是否曾有任一班級的 `status='approved'` 報名記錄（`prisma.inviteEnrollment.count({ where: { userId, status: 'approved' } })`）：曾有（上過課）→ `materialChoice: 'none'`（視為已有教材）；從未有（新生）→ `materialChoice: 'traditional'`（預設帶入繁體教材）。此判斷不分課程種類、不排除本次新增的班級（新增當下該班尚無此人的報名，不影響判斷），純粹以「是否曾被核准加入過任何班級」作為「是否上過課」的依據。
- **`EnrollmentApplicationDialog`（自行申請）**：`useState<MaterialChoice | ''>('')` 改為初始值 `'traditional'`，讓學員一開啟 Dialog 即預選繁體教材，仍可自由改選其他三個選項或維持不選（`selected` 型別維持含 `''` 以外的情境下由使用者主動點選其他項目時才變更）。此處不比照 `addStudentToInvite` 做「是否上過課」判斷，因為自行申請本來就是學員本人主動選擇，預選僅是降低操作步驟，不需要額外的推斷邏輯。
- 保留 Prisma schema 的 `@default(none)` 不動：此欄位在其他情境（若未來新增其他建立報名的路徑）仍以「未指定即視為無教材需求」作為保守預設，符合資料庫層防禦式預設值的一般原則；本次需求只要求「新增學員」與「自行申請」這兩個實際入口的行為改變，不需要也不應該連動修改 schema 預設值。

### 3. 已核准後變更教材選擇：新增獨立 Server Action，而非放寬既有 `applyToCourse`
新增 `updateMyMaterialChoice(inviteId, materialChoice, bookName?)`：
- 權限：`session.user.id` 必須等於該筆 `InviteEnrollment.userId`（僅本人可改自己的選擇，不開放老師/管理者代改，對應 Non-Goals）。
- 前置條件：`status === 'approved'`（尚未核准者走既有 `applyToCourse` 流程，不受影響）；`invite.materialFinalizedAt IS NULL`（教材需求一旦被講師「確認完成」即鎖定，理由：`finalizeMaterialOrders` 之後講師已依當時的教材需求清單建立/確認 `CourseOrder`，此時再變更會造成訂單與實際需求不一致）。
- 不重用 `applyToCourse`（該函式的語意是「建立新報名」，包含報名資格檢查、人數上限等與「已核准後修改既有報名」無關的邏輯，混用會讓函式承擔兩種不同的前置條件與副作用，改為新增小函式更單純）。

### 4. `EnrollmentApplicationDialog` 擴充為支援「申請」與「變更」兩種模式
新增 `mode?: 'apply' | 'edit'`（預設 `'apply'`，向後相容既有呼叫端）與 `initialMaterialChoice`／`initialBookName`：
- `mode='apply'`：沿用 `applyToCourse`，標題／確認按鈕文案不變（Dialog 初始選取值改為 `'traditional'`，見決策 2）。
- `mode='edit'`：呼叫 `updateMyMaterialChoice`，標題改為「變更教材選擇」、確認按鈕改為「確認變更」、成功訊息改為「教材選擇已更新」；初始選取值與教材姓名帶入該筆報名目前的值，而非固定的 `'traditional'`。
- 選擇拓展既有元件而非另建一個新元件：兩種模式的 UI（四選項卡片＋教材姓名欄位）完全一致，僅送出邏輯與文案不同，符合「不要為相似邏輯建立重複元件」的專案慣例。

### 5. `student-apply-section.tsx` 已核准分支的呈現
在原本「✓ 已加入此課程」文字下方，新增一行教材選擇摘要（依 `materialChoice` 顯示對應 label；`none` 顯示「已有教材」）：
- 未 finalize：摘要旁附「變更教材選擇」按鈕，點擊以 `mode='edit'` 開啟 `EnrollmentApplicationDialog`。
- 已 finalize：不顯示變更按鈕，改顯示提示文字「教材已確認申請，如需異動請洽老師」，避免學員誤以為仍可自行修改。

## Risks / Trade-offs

- **風險**：`materialFinalizedAt` 之後才發現需要變更教材，目前設計是完全鎖定、只能請學員找老師人工處理（沿用既有講師端「教材申請」流程，未新增例外通道）——刻意不做，因為 finalize 之後的變更牽涉已建立的 `CourseOrder`／`MaterialShipmentItem`，屬於既有教材出貨管理範疇，超出本次「書籍購買優化」的票單範圍。
- **相容性**：`addStudentToInvite` 對既有（本次上線前）已建立、`materialChoice=none` 的 approved 報名不會回溯修改，只影響本次上線後新建立的報名；如需回填舊資料需另開票單處理，不在本次範圍。

## Migration Plan

無資料庫 schema 變更，僅應用層邏輯與文案調整，隨版本部署即生效，不需 migration 或資料回填。

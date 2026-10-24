## Why

「世代倍增」代數計算（`lib/data/monthly-report.ts` `generations()` / `generationTeacherDetails()`）以「本人最早一筆已結業『啟動靈人』(book1) 紀錄所屬班級建立者」為 mentor，若本人完全找不到這筆紀錄即判定為第 0 代（根節點）。目前系統完全沒有限制「本人未結業某書」的使用者取得該書講師身分／開班授課，導致實測發現兩個真實異常帳號：

- **盧蔡美玲**（PA261678）：於 2026-08-26 由管理者透過「新增會員」直接勾選 `teacher_1` 建立帳號，當時完全沒有任何啟動靈人結業紀錄；之後建立「盧蔡美玲 的 啟動靈人」班級（invite#549）並教出 3 位結業學生，被系統誤判為第 0 代。Justin 已手動補一筆她在葉君儀班級的結業紀錄暫時修正。
- **盧正義**（PA260268）：自己的啟動靈人結業紀錄（2026-10-04，張幸瑜班）晚於他自己開班教出的學生結業時間（9 月底前），在 2026-09 月報 cutoff 下被誤判為第 0 代。

經討論確認：月報「世代隨月份連動」是既有 `admin-dashboard-monthly-report` spec 明文規定的既定行為（非 bug，如實反映歷史快照），本次**不**更動月報計算邏輯。真正要處理的是源頭——系統讓「本人未結業某書」的帳號取得該書講師身分／開班資格，共有三個入口都沒有檢查：
1. 「新增會員」對話框（`createMember`）：可直接勾選 `teacher_1`～`teacher_3` 建立帳號（盧蔡美玲案例的實際成因）。
2. 「講師身分分頁」卡片式授予（`grantTeacherRole`）。
3. 「會員身分編輯」身分集合勾選（`updateMemberRoles`）。

## What Changes

- 新增共用檢查 `hasGraduatedBook(userId, courseCatalogId)`（`lib/data/`），判定該使用者是否有至少一筆對應 `courseCatalogId` 的已結業（`graduatedAt` 非空）`InviteEnrollment`。
- `grantTeacherRole`、`updateMemberRoles` 在「新增」`teacher_1`～`teacher_3` 時，SHALL 先以 `hasGraduatedBook` 檢查目標會員已結業對應書籍，未通過則拒絕並回傳明確錯誤訊息；移除身分不受影響。
- 「新增會員」對話框與 `createMember` SHALL 不再允許於建立帳號的同時勾選 `teacher_1`～`teacher_3`（新帳號必然尚無結業紀錄，規則上永遠無法通過檢查）；僅保留 `admin`／`superadmin` 可於建立時勾選。需先建立帳號、待其本人結業後，再透過「講師身分分頁」或「會員身分編輯」授予。
- 盤點歷史資料中所有「有教出結業學生但自己無對應書籍結業紀錄，或自己結業時間晚於學生」的異常帳號，逐一確認並修正代數鏈（補結業紀錄或調整師徒關係）——一次性資料修正，列於 `tasks.md`，不產生新的程式邏輯。
- 「新增會員」對話框新增說明文字，告知管理者「為何這裡沒有講師身分選項、要怎麼做才能授予」。
- 驗證過程中發現 `components/admin/member-roles-editor.tsx`（spec 原先描述可勾選 `teacher_1`～`teacher_3` 的「會員身分編輯」畫面）從未被任何頁面引用，是既有孤兒元件（非本次變更造成），經 Justin 確認予以刪除；現場唯一會呼叫 `updateMemberRoles` 的「特殊設定」分頁（`MemberSpecialRoles`）僅處理 `admin`／`superadmin`，不涉及書籍講師身分。

## Capabilities

### Modified Capabilities
- `admin-member-management`：「新增會員」「會員身分編輯」「講師身分分頁 — 卡片式授權與確認」三個 Requirement 新增「本人已結業對應書籍」前置檢查。

## Impact

- **後端**：`app/actions/admin.ts` 的 `createMember`、`grantTeacherRole`、`updateMemberRoles` 三個 Server Action；新增 `lib/data/teacher-eligibility.ts`。
- **前端**：`components/admin/create-member-dialog.tsx` 的身分勾選清單改為僅 `admin`／`superadmin`（不再用完整的 `ASSIGNABLE_ROLES`），並新增說明文字；刪除孤兒元件 `components/admin/member-roles-editor.tsx`。
- **資料**：一次性盤點／修正歷史異常帳號的代數鏈（操作性任務，見 `tasks.md`，不改動程式邏輯）。
- 不涉及月報計算邏輯（`lib/data/monthly-report.ts`）與既有 `admin-dashboard-monthly-report` spec，維持「世代隨月份連動」現狀。

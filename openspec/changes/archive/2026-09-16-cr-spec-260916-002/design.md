## Context

CR-SPEC-260916-001 已在 `app/actions/invite-students.ts` `addStudentToInvite` 內以 inline 邏輯實作「依是否上過課決定教材預設值」：`prisma.inviteEnrollment.count({ where: { userId, status: 'approved' } }) > 0 ? 'none' : 'traditional'`。但「學員自行申請」路徑（`components/course-session/enrollment-application-dialog.tsx` `mode='apply'`）當時為降低操作步驟，直接把初始選取值寫死為 `'traditional'`，未套用上過課判斷。`EnrollmentApplicationDialog` 已有 `initialMaterialChoice` prop（CR-001 為 `mode='edit'` 而加），apply 模式目前呼叫端未傳入此 prop，因此落到元件內部預設值 `'traditional'`。

## Goals / Non-Goals

- Goals：自行申請與新增學員兩個入口採同一套「是否上過課」判斷邏輯；調整教材選項顯示順序。
- Non-Goals：不改變 `MaterialChoice` 資料模型；不改變「上過課」的判斷定義（沿用 CR-001 的定義：曾有任一班級 `status=approved` 報名記錄）；不變更已核准後「變更教材選擇」（`updateMyMaterialChoice`）的權限與 finalize 鎖定規則。

## Decisions

### 1. 抽出共用函式，而非在兩處各自複製判斷邏輯
新增 `lib/data/material-items.ts` 的 `getDefaultMaterialChoiceForUser(userId): Promise<'none' | 'traditional'>`，內容即原本 `addStudentToInvite` 的 count 查詢＋三元判斷；`addStudentToInvite` 改呼叫此函式（純重構，行為不變）。放在 `lib/data/material-items.ts` 而非新檔，因為該檔已有 `getDefaultBookNameForUser`（同樣是「申請/申購對話框預帶值」的資料層函式），語意相近、就近擴充比另開檔案更符合現有結構。

### 2. 於 Server Component 計算並經 props 傳遞，不在 Dialog 內部另發請求
比照既有 `applicantBookNameDefault` 的作法：`page.tsx` 於 `currentUserId && !isInstructor && !myEnrollment` 條件下呼叫 `getDefaultMaterialChoiceForUser(currentUserId)`，結果經 `StudentApplySection` 新增的 `defaultMaterialChoice` prop，傳給 apply 模式 `EnrollmentApplicationDialog` 的既有 `initialMaterialChoice` prop（CR-001 已定義此 prop，本次只是讓 apply 模式的呼叫端也傳入，而非新增 prop）。維持既有「Server Component 算好、Client Component 純渲染」的資料流模式，不在 Dialog 內部另發 fetch。

### 3. 教材選項順序：僅調整陣列元素順序
`enrollment-application-dialog.tsx` 的 `MATERIAL_OPTIONS` 陣列，元素順序由 `[none, traditional, simplified, english]` 改為 `[traditional, simplified, english, none]`；`value`／`label`／`desc` 對應內容不變，僅影響畫面排列順序。因 apply／edit 兩模式共用同一元件與同一陣列，兩種情境的選項順序一併套用新順序，不需分別處理。

## Risks / Trade-offs

- 兩處判斷邏輯合一後，若未來「上過課」定義需調整（例如排除某類課程），只需改 `getDefaultMaterialChoiceForUser` 一處，屬正向影響、無風險。
- 選項順序調整為純視覺變更，不影響既有資料、送出邏輯或既有 `InviteEnrollment` 記錄，無資料相容性風險。

## Migration Plan

無資料庫變更，純應用層邏輯抽取（重構）與 UI 選項順序調整，隨版本部署即生效，不需 migration 或資料回填。

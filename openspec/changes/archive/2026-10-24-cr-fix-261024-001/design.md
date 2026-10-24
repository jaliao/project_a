## Context

目前授予書籍講師身分（`teacher_1`～`teacher_3`）有三個入口，皆未檢查目標會員是否已結業對應書籍：

1. `createMember`（`app/actions/admin.ts`）＋「新增會員」對話框（`components/admin/create-member-dialog.tsx`）：roles 勾選清單直接套用 `ASSIGNABLE_ROLES`（含 `teacher_1`～`teacher_3`／`admin`／`superadmin`），可在帳號剛建立、完全無任何報名紀錄時就勾上講師身分。盧蔡美玲（PA261678）即為此路徑產生：2026-08-26 建立帳號時已勾 `teacher_1`，隔天才報名（且是 catalog 2，非 catalog 1），從未結業 catalog 1。
2. `grantTeacherRole`（講師身分分頁卡片式授予）：僅檢查操作者權限（`canAssignRole`），不檢查目標會員的結業狀態。
3. `updateMemberRoles`（會員身分編輯／身分集合勾選）：僅檢查操作者對「有變動」身分的授權層級（`canAssignRole`），同樣不檢查結業狀態。

「已結業」的判定已有既定資料語意（`course-graduation` capability）：`InviteEnrollment.graduatedAt` 非空即視為該筆報名已結業；書籍講師身分與 `CourseCatalog.id` 的對應已集中於 `lib/auth-roles.ts` 的 `CATALOG_BY_TEACHER_ROLE`（單一真實來源），可直接複用。

## Goals / Non-Goals

**Goals:**
- 三個授予講師身分的入口，在「新增」`teacher_1`～`teacher_3` 身分時一致套用「本人已結業對應書籍」檢查，不留漏洞。
- 複用既有的書籍↔身分對應（`CATALOG_BY_TEACHER_ROLE`），不新增第二套對應表。
- 不影響移除身分、不影響 `admin`／`superadmin` 身分的授予（這兩者與「結業」無關）。

**Non-Goals:**
- 不提供管理者「強制略過檢查」的覆蓋選項——業務要求是「禁止」，非警示後可繼續；若未來需要例外（如人工核實的歷史個案），留待另開 CR 討論，本次不預先設計 bypass 參數。
- 不更動「世代倍增」月報計算邏輯與既有 `admin-dashboard-monthly-report` spec（已與使用者確認維持「世代隨月份連動」現狀，見 proposal `Why`）。
- 不處理歷史 seed／匯入資料（`prisma/seed.ts`、`starter-graduation-import`）——那些路徑是直接寫入資料庫，不經過本次新增檢查的 Server Action，且黃國倫等保留帳號本就刻意無結業紀錄（系統根節點），不應受此規則影響。

## Decisions

### 1. 新增共用檢查函式 `hasGraduatedBook`，放在 `lib/data/teacher-eligibility.ts`

```ts
export async function hasGraduatedBook(
  userId: string,
  courseCatalogId: number,
): Promise<boolean> {
  const enrollment = await prisma.inviteEnrollment.findFirst({
    where: { userId, graduatedAt: { not: null }, invite: { courseCatalogId } },
    select: { id: true },
  })
  return !!enrollment
}
```

放在 `lib/data/` 符合既有「資料存取層」慣例（CLAUDE.md 第 3 點），供三個 Server Action 共用，避免各自重複查詢條件。

### 2. `grantTeacherRole` 與 `updateMemberRoles`：在加入 teacher_N 前呼叫檢查

`grantTeacherRole(userId, role)`：

```ts
const catalogId = CATALOG_BY_TEACHER_ROLE[role]
if (!(await hasGraduatedBook(userId, catalogId))) {
  return {
    success: false,
    message: `此會員尚未結業《${BOOK_LABEL_BY_TEACHER_ROLE[role]}》，無法授予此講師身分`,
  }
}
```

`updateMemberRoles(userId, roles)`：沿用既有 `changed`（有變動的身分）清單，對其中「新增且為 `TeacherRole`」者逐一檢查：

```ts
for (const r of changed) {
  if (!canAssignRole(session.user.roles, r)) {
    return { success: false, message: '無權限' }
  }
  if (TEACHER_ROLES.includes(r as TeacherRole) && after.has(r) && !before.has(r)) {
    const catalogId = CATALOG_BY_TEACHER_ROLE[r as TeacherRole]
    if (!(await hasGraduatedBook(userId, catalogId))) {
      return {
        success: false,
        message: `此會員尚未結業《${BOOK_LABEL_BY_TEACHER_ROLE[r as TeacherRole]}》，無法授予此講師身分`,
      }
    }
  }
}
```

檢查放在既有權限迴圈內，一次迴圈完成授權與結業雙重檢查，不額外多一次迴圈。

### 3. `createMember`：直接移除 `teacher_1`～`teacher_3` 選項，不做「允許但擋下」

新帳號在建立當下必然沒有任何報名紀錄（帳號才剛產生），`hasGraduatedBook` 必為 `false`，等同「規則上永遠無法通過」。與其讓使用者勾選後才被拒絕，直接：

- `createMemberSchema` 的 `roles` 列舉改為僅 `['admin', 'superadmin']`。
- `create-member-dialog.tsx` 的身分勾選清單改用新的 `ASSIGNABLE_ROLES_ON_CREATE = ['admin', 'superadmin']`（於 `lib/auth-roles.ts` 新增此常數，`ASSIGNABLE_ROLES` 本身不變，仍供「會員身分編輯」頁沿用）。

若管理者嘗試直接帶 `teacher_1`～`teacher_3` 呼叫 `createMember`（例如繞過前端），`zod` schema 驗證即會拒絕，回傳欄位錯誤，行為與其他欄位驗證一致。

### 4. 錯誤訊息風格比對既有慣例

沿用 `course-session.ts` 既有風格（`須具備${course.label}講師身分才能授課`），採「此會員尚未結業《{書名}》，無法授予此講師身分」，書名以《》標示與既有通知信（`sendTeacherRoleGrantedEmail`）文案一致。

## Risks / Trade-offs

- `createMember` 拿掉講師身分選項後，既有「建立帳號當下就先掛好講師身分」的手動捷徑會消失，管理者需改為「先建帳號→等本人結業→再至講師身分分頁授予」，多一步操作；這正是本次要堵住的漏洞，屬預期中的行為改變。
- 本次不處理「已核准（approved）但尚未結業」是否該視為足夠資格——沿用 `course-graduation` capability 既有定義，僅 `graduatedAt` 非空才算結業，與月報 `generations()` 的判定基準一致，不產生兩套「結業」定義。

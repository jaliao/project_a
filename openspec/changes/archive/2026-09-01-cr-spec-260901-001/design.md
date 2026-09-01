## Context

- **名冊 seed**（`member-roster-seed` / `seed-roster-data`）：純學員 `User` 的登入 `email` 為 `{spiritId}@seed.iwillshare.org.tw`、`isTempPassword = true`、`roles = [user]`；教師 Email 衝突或缺漏時亦用同款合成 Email，`roles = [user, teacher]`（現制為 `teacher_1`～`teacher_3`）。seed 為每位教師的每個班級欄建 `CourseInvite`（`courseCatalogId = 1` 啟動靈人、`createdById = 該教師`），班上學員以 `InviteEnrollment(status = approved)` 報名；對應不到的教師歸黃國倫收容課程。
- **找回帳號**（`account-recovery`）：未啟用帳號（`lastLoginAt = null` 且 `isTempPassword = true`）經中文名字查詢 → 選擇題 → 確認/改 Email → 於單一交易更新 `email`、重產臨時密碼、更新白名單。**成功後 `email` 不再是 `@seed.iwillshare.org.tw`**。
- **`lib/mailer.ts`**：已有 `const SYNTHETIC_EMAIL_DOMAIN = '@seed.iwillshare.org.tw'`（未 export）與 `isUndeliverableEmail(email)`（`.trim().toLowerCase().endsWith(...)`）。
- **`member-export` 現況**：`/admin/members` 兩顆按鈕連到 `GET /api/admin/members/export`（可帶 `q/gender/role/church`）；route handler 用 `lib/data/members.ts` 的 `exportMembers(filters)`，以 `xlsx` 套件 `XLSX.utils.json_to_sheet` 產檔；欄位中文化函式 `formatGender` / `formatChurch` / `formatRoles` 在 route handler 內。
- **`lib/auth-roles.ts`**：`TEACHER_ROLES = ['teacher_1','teacher_2','teacher_3']`、`hasRole(roles, role)`、`canAccessAdmin(roles)`。
- **`lib/utils/member-display.ts`**：`getMemberDisplayName({realName, englishName, nickname, displayNameMode})`。

本 CR＝**新增一支範圍固定、精簡 6 欄的匯出**（資料層函式 ＋ route handler ＋ 一顆按鈕），不動既有 `member-export` 的任何行為。

## Goals / Non-Goals

**Goals：**
- 後台管理者可在 `/admin/members` 一鍵下載「尚未找回帳號」（登入 Email 仍為 `@seed.iwillshare.org.tw`）的會員名冊。
- 欄位：啟動編號、真實姓名、性別、所屬教會、授課老師、身分別（講師／學員）。
- 具講師身分者一併納入，以「身分別」欄區分。
- 非 admin 呼叫 API 回 401。

**Non-Goals：**
- 不改既有 `GET /api/admin/members/export` 與其兩顆按鈕、13 欄定義。
- 不加 query 篩選（此匯出範圍固定為「全部未找回帳號」）。
- 不以 `lastLoginAt` 判定（使用者明確以「`@seed.iwillshare.org.tw`」定義族群；登入過但沒找回帳號者仍應納入）。
- 不改 Prisma schema、seed、找回帳號流程。
- 不做 i18n（後台專屬字串本階段維持繁體）。

## Decisions

### 1. 族群判定 = 登入 Email 網域，不用 `lastLoginAt`

`where: { email: { endsWith: '@seed.iwillshare.org.tw', mode: 'insensitive' } }`。

- 找回帳號成功會覆寫 `email`，故「Email 仍為合成網域」與「沒找回帳號」等價，且涵蓋「用臨時密碼登入過但沒走找回流程」的情況（這類人 `lastLoginAt` 非 null，用未啟用清單的條件會漏掉）。
- 合成網域字串：於 `lib/data/members.ts` 內宣告模組常數

  ```ts
  // 名冊 seed 合成登入信箱網域（{spiritId}@seed.iwillshare.org.tw，見 member-roster-seed spec）
  // 與 lib/mailer.ts 的 SYNTHETIC_EMAIL_DOMAIN 同值
  const SEED_SYNTHETIC_EMAIL_DOMAIN = '@seed.iwillshare.org.tw'
  ```

  不從 `lib/mailer.ts` import（避免資料層耦合 mailer／nodemailer 模組載入）。字面值已同時存在於 `roster.json`、`lib/mailer.ts`，再多一處並附交叉註解可接受。

### 2. 資料層：`exportUnrecoveredSeedMembers()`（`lib/data/members.ts`）

```ts
export async function exportUnrecoveredSeedMembers() {
  const rows = await prisma.user.findMany({
    where: { email: { endsWith: SEED_SYNTHETIC_EMAIL_DOMAIN, mode: 'insensitive' } },
    orderBy: [{ spiritId: { sort: 'asc', nulls: 'last' } }],
    select: {
      spiritId: true,
      realName: true,
      gender: true,
      roles: true,
      church: { select: { name: true } },
      churchOther: true,
      churchType: true,
      inviteEnrollments: {
        where: { status: 'approved' },
        select: {
          invite: {
            select: {
              createdBy: {
                select: {
                  realName: true, name: true, englishName: true,
                  nickname: true, displayNameMode: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return rows.map((r) => {
    const seen = new Set<string>()
    const teacherNames: string[] = []
    for (const e of r.inviteEnrollments) {
      const t = e.invite.createdBy
      const label = (t.realName?.trim() || getMemberDisplayName(t)).trim()
      if (label && !seen.has(label)) { seen.add(label); teacherNames.push(label) }
    }
    const { inviteEnrollments: _omit, ...rest } = r
    return { ...rest, teacherNames }
  })
}
```

- 「授課老師」取 `invite.createdBy`（課程建立者＝授課老師）。優先 `realName`；缺則退 `getMemberDisplayName`。去重、保留出現順序。
- 排序用 `spiritId asc`（名冊號段連續，方便核對），`null` 殿後。

### 3. Route Handler：`app/api/admin/members/unrecovered/export/route.ts`

比照 `app/api/admin/members/export/route.ts` 骨架：

```ts
export async function GET() {
  const session = await auth()
  if (!session?.user || !canAccessAdmin(session.user.roles)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const members = await exportUnrecoveredSeedMembers()

  const rows = members.map((m) => ({
    啟動編號: m.spiritId ?? '',
    真實姓名: m.realName ?? '',
    性別: formatGender(m.gender),
    所屬教會: formatChurch(m.church?.name, m.churchOther, m.churchType),
    授課老師: m.teacherNames.join('、'),
    身分別: TEACHER_ROLES.some((r) => m.roles.includes(r)) ? '講師' : '學員',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '未找回帳號')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const dateStr = new Date().toISOString().slice(0, 10)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="unrecovered-members-${dateStr}.xlsx"`,
    },
  })
}
```

- `formatGender` / `formatChurch`：與既有 export route 同規則。可各自在本檔複寫一份小函式（兩檔各自獨立，維持現況風格；不特地抽共用模組）。
- `GET` 不讀任何 query 參數。
- `NextRequest` 參數可省略（無 query 需求）。
- `route.ts` 位於 `app/api/admin/*`，middleware 已擋未登入；route handler 內再驗 `canAccessAdmin`，與既有 export route 一致。

### 4. UI：`/admin/members` 第三顆按鈕

`app/[locale]/(admin)/admin/members/page.tsx` 現有結構（約 L70–87）兩顆按鈕（`Button asChild` 包 `Link`）。加第三顆：

```tsx
<Button asChild variant="outline">
  <a href="/api/admin/members/unrecovered/export">匯出未找回帳號</a>
</Button>
```

- 用原生 `<a>`（下載檔案、非 client 導航），與既有「匯出全部」若用 `Link` 則沿用 `Link`——**與該檔現有兩顆的寫法保持一致**（實作時對齊現有那兩顆用的是 `Link` 還是 `<a>`）。
- 不帶 `exportQs`（範圍固定）。
- 位置：置於「匯出全部」之後。

## Risks / Trade-offs

- **[取捨] 網域字面值三處重複**（`roster.json`／`lib/mailer.ts`／`lib/data/members.ts`）：換取資料層不 import mailer。以交叉註解標明；日後若要收斂可另開小 CR 抽 `lib/constants`。
- **[風險] 教師合成 Email**：`member-roster-seed` 說教師 Email「衝突或缺漏則用合成 Email」，故名單可能含 `roles` 帶 `teacher_*` 者——正是使用者要「註記講師」的情境，符合預期。
- **[風險] `spiritId` 為 null 的合成帳號**：理論上 seed 都有 `spiritId`；仍以 `nulls: 'last'` 防呆，欄位輸出空字串。
- **[效能] `inviteEnrollments` 巢狀 include**：名冊規模（數百人），單次 `findMany` 可接受；無分頁需求（匯出本就要全量）。
- **[相容] 既有 `member-export`**：零改動，新 route／函式獨立，互不影響。

## Migration Plan

1. `lib/data/members.ts`：加 `SEED_SYNTHETIC_EMAIL_DOMAIN` 常數 ＋ `exportUnrecoveredSeedMembers()`（import `getMemberDisplayName`）。
2. 新增 `app/api/admin/members/unrecovered/export/route.ts`（骨架仿既有 export route；import `TEACHER_ROLES`、`canAccessAdmin`、`exportUnrecoveredSeedMembers`）。
3. `app/[locale]/(admin)/admin/members/page.tsx`：加第三顆匯出按鈕（不帶篩選參數）。
4. `npm run lint`、`npx tsc --noEmit`、`npm run build`。
5. 實測：以 admin 開 `/admin/members` → 點「匯出未找回帳號」→ 下載 `unrecovered-members-YYYY-MM-DD.xlsx`；核對 6 欄、性別中文化、教會欄組法、授課老師去重頓號分隔、講師列「身分別＝講師」；找回帳號後該人自名單消失；非 admin 直接打 API → 401。
6. `doc/管理者操作手冊.md` 補按鈕說明 ＋ 檔首版本/日期；`config/version.json` patch +1、`updatedAt`；`ai-context/03-architecture.md`、`07-current-tasks.md`、`README-AI.md` 同步。

**Rollback**：新增檔刪除 ＋ revert `members.ts`／`page.tsx` 兩處 diff 即可；無 schema／資料／路由影響。

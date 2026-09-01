## 1. 資料層：`lib/data/members.ts`

- [x] 1.1 檔頂加入模組常數 `const SEED_SYNTHETIC_EMAIL_DOMAIN = '@seed.iwillshare.org.tw'`，附註解「名冊 seed 合成登入信箱網域，見 `member-roster-seed` spec；與 `lib/mailer.ts` `SYNTHETIC_EMAIL_DOMAIN` 同值」
- [x] 1.2 若尚未 import，加 `import { getMemberDisplayName } from '@/lib/utils/member-display'`
- [x] 1.3 新增 `export async function exportUnrecoveredSeedMembers()`：`prisma.user.findMany`
  - `where: { email: { endsWith: SEED_SYNTHETIC_EMAIL_DOMAIN, mode: 'insensitive' } }`
  - `orderBy: [{ spiritId: { sort: 'asc', nulls: 'last' } }]`
  - `select`：`spiritId`、`realName`、`email`、`gender`、`roles`、`teacherNo`、`church: { select: { name: true } }`、`churchOther`、`churchType`、`inviteEnrollments: { where: { status: 'approved' }, select: { invite: { select: { createdBy: { select: { realName, name, englishName, nickname, displayNameMode } } } } } }`
- [x] 1.4 `.map` 每筆整理 `teacherNames: string[]`：逐筆 approved 報名取 `invite.createdBy`，`label = createdBy.realName?.trim() || getMemberDisplayName(createdBy)`；用 `Set` 去重、保留出現順序；回傳 `{ spiritId, realName, email, gender, roles, teacherNo, church, churchOther, churchType, teacherNames }`（移除 `inviteEnrollments`）
- [x] 1.5 匯出型別（如 `member-export` 現況般）或讓 route handler 直接推導皆可，不強制新增 export type

## 2. Route Handler：`app/api/admin/members/unrecovered/export/route.ts`（新檔）

- [x] 2.1 檔首標準註解（元件名「Route Handler - 未找回帳號名冊 Excel 匯出」、路徑、日期 `2026-09-01`）
- [x] 2.2 import：`NextResponse`（`next/server`）、`* as XLSX from 'xlsx'`、`auth`（`@/lib/auth`）、`canAccessAdmin`（`@/lib/auth-roles`）、`TEACHER_ROLES`（`@/lib/auth-roles`）、`exportUnrecoveredSeedMembers`（`@/lib/data/members`）
- [x] 2.3 本檔複寫 `formatGender(gender)`（`male`→男 / `female`→女 / else→未指定）與 `formatChurch(name, other, type)`（`name ?? other ?? type ?? ''`），規則與 `app/api/admin/members/export/route.ts` 一致
- [x] 2.4 `export async function GET()`：`const session = await auth()`；`if (!session?.user || !canAccessAdmin(session.user.roles)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`
- [x] 2.5 `const members = await exportUnrecoveredSeedMembers()`；每筆 `isTeacher = TEACHER_ROLES.some(r => m.roles.includes(r))`；`rows = members.map(m => ({ 啟動編號: m.spiritId ?? '', 真實姓名: m.realName ?? '', Email: m.email ?? '', 性別: formatGender(m.gender), 所屬教會: formatChurch(m.church?.name, m.churchOther, m.churchType), 授課老師: m.teacherNames.join('、'), 身分別: isTeacher ? '講師' : '學員', 講師編號: isTeacher ? (m.teacherNo ?? '') : '' }))`
- [x] 2.6 產檔：`XLSX.utils.json_to_sheet(rows)` → `book_new()` → `book_append_sheet(wb, ws, '未找回帳號')` → `XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })`
- [x] 2.7 `const dateStr = new Date().toISOString().slice(0, 10)`；回傳 `new NextResponse(buffer, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': \`attachment; filename="unrecovered-members-${dateStr}.xlsx"\` } })`
- [x] 2.8 不讀取任何 `searchParams`

## 3. UI：`app/[locale]/(admin)/admin/members/page.tsx`

- [x] 3.1 在現有「匯出 {result.total} 筆」「匯出全部」按鈕之後，加第三顆匯出按鈕，連到 `/api/admin/members/unrecovered/export`，文字「匯出未找回帳號」，`variant="outline"`
- [x] 3.2 按鈕的連結寫法（`<Button asChild><Link>` 或 `<Button asChild><a>`）對齊該檔既有兩顆匯出按鈕的寫法；**不帶** `exportQs`（範圍固定）
- [x] 3.3 更新檔首註解日期為 `2026-09-01`

## 4. 驗證

- [x] 4.1 `npm run lint`：本次檔案 0 error
- [x] 4.2 `npx tsc --noEmit`：0 error
- [x] 4.3 `npm run build`：`✓ Compiled successfully`
- [~] 4.4 **（人工實測）** 以 admin 開 `/admin/members` → 點「匯出未找回帳號」→ 下載 `unrecovered-members-YYYY-MM-DD.xlsx`
- [~] 4.5 **（人工實測）** 開啟檔案：欄序為 啟動編號、真實姓名、Email、性別、所屬教會、授課老師、身分別、講師編號；Email 為 `xxx@seed.iwillshare.org.tw`；性別為中文；教會欄依 `church.name → churchOther → churchType` 呈現；資料列依啟動編號遞增
- [~] 4.6 **（人工實測）** 授課老師欄：多筆報名者列出去重後的建立者姓名、以頓號分隔；無報名者留空
- [~] 4.7 **（人工實測）** 具講師身分（`teacher_*`）的合成 Email 帳號出現在名單且「身分別」為「講師」、「講師編號」欄為其 `teacherNo`；純學員「身分別」為「學員」、「講師編號」欄留空
- [~] 4.8 **（人工實測）** 對某未啟用帳號走完「找回帳號」改 Email 後，再匯出 → 該人已不在名單
- [~] 4.9 **（人工實測）** 未登入 / 非 admin 直接 GET `/api/admin/members/unrecovered/export` → 401；既有 `/api/admin/members/export` 兩顆按鈕行為不變（回歸）

## 5. 文件與版本號同步

- [x] 5.1 `doc/管理者操作手冊.md`：會員管理章節補「匯出未找回帳號」按鈕（位置、8 欄欄位、範圍＝登入信箱仍為 `@seed.iwillshare.org.tw` 者、不受搜尋篩選影響）；檔首版本 ＋ 日期 `2026-09-01`
- [x] 5.2 `doc/老師手冊.md`／`doc/學員手冊.md`：本功能為純後台，無需更新（僅確認無相關章節受影響）
- [x] 5.3 `config/version.json`：patch +1（以套用當下值為基準），`updatedAt` → `2026-09-01`
- [x] 5.4 `ai-context/03-architecture.md`：`app/api/admin/members/` 說明補 `unrecovered/export` route（未找回帳號名冊匯出，8 欄）
- [x] 5.5 `ai-context/07-current-tasks.md`：於「已完成」清單最前面追加本 CR 記錄
- [x] 5.6 `README-AI.md`：版本行同步（若有版本標註）

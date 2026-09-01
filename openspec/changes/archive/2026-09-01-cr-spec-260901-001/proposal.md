## Why

需求單 CR-SPEC-260901-001（提出人：廖柏嘉 Justin，2026-09-01）：**「匯出還沒找回帳號的學員名單」**。原文：

> 匯出還沒找回帳號的學員名單
> 就是那些 `@seed.iwillshare.org.tw` 的人
> 包含姓名、教會、性別 資料、編號、授課老師
> 如果是講師的部分需要註記，不是講師就註記學員

名冊 seed（見 `member-roster-seed` / `seed-roster-data`）為每位人員建立合成登入 Email `{spiritId}@seed.iwillshare.org.tw`（不可送達）。會員走「找回帳號」（`account-recovery`）流程確認 / 改成真實 Email 後，該合成 Email 即被替換。因此「Email 仍為 `@seed.iwillshare.org.tw`」＝**尚未找回帳號**。目前 `/admin/members` 只有「匯出 N 筆 / 匯出全部」（`member-export`，13～18 欄的完整會員欄位），無法針對「未找回帳號」這一群、以事工要的精簡欄位一鍵匯出。

使用者澄清（2026-09-01）：
- **範圍＝全部 `@seed.iwillshare.org.tw` 帳號**（含具講師身分者），不限純學員；以「身分別」欄註記「講師」或「學員」。
- 匯出按鈕放在**會員管理頁 `/admin/members`**，與現有兩顆匯出按鈕並列。
- 「授課老師」欄：**列出該人所有已核准報名課程的建立者（授課老師），去重、以頓號分隔**。

## What Changes

### 1. 資料層：`exportUnrecoveredSeedMembers()`（`lib/data/members.ts`）

- 新增查詢函式，回傳所有 `email` 以 `@seed.iwillshare.org.tw` 結尾（不分大小寫）的 `User`，排序 `spiritId asc`（null 殿後），`select`：
  - `spiritId`、`realName`、`email`、`gender`、`roles`、`teacherNo`
  - `church: { select: { name: true } }`、`churchOther`、`churchType`
  - `inviteEnrollments`（`where: { status: 'approved' }`）→ `invite.createdBy: { select: { realName, name, englishName, nickname, displayNameMode } }`
- 合成網域字串以模組內常數 `SEED_SYNTHETIC_EMAIL_DOMAIN = '@seed.iwillshare.org.tw'` 表示（附註「與 `lib/mailer.ts` `SYNTHETIC_EMAIL_DOMAIN` 同值，見 `member-roster-seed` spec」）；用 `where: { email: { endsWith: SEED_SYNTHETIC_EMAIL_DOMAIN, mode: 'insensitive' } }`。
- 對每筆整理出 `teacherNames: string[]`：取各 approved 報名的 `invite.createdBy`，以 `realName || getMemberDisplayName(...)` 求值、去重、原順序保留。

### 2. Route Handler：`GET /api/admin/members/unrecovered/export`

- 新檔 `app/api/admin/members/unrecovered/export/route.ts`。
- 驗證 `auth()` + `canAccessAdmin(session.user.roles)`，否則 `401`。
- 呼叫 `exportUnrecoveredSeedMembers()`，組 `.xlsx`（`xlsx` 套件，工作表名「未找回帳號」），欄位依序 **8 欄**：
  | 欄名 | 來源 / 規則 |
  |---|---|
  | 啟動編號 | `spiritId ?? ''` |
  | 真實姓名 | `realName ?? ''` |
  | Email | `email ?? ''`（合成信箱 `{spiritId}@seed.iwillshare.org.tw`） |
  | 性別 | `male`→男、`female`→女、`unspecified`/null→未指定 |
  | 所屬教會 | `church?.name ?? churchOther ?? churchType ?? ''`（沿用 `member-export` 的 `formatChurch` 組法） |
  | 授課老師 | `teacherNames.join('、')`（無報名 → 空字串） |
  | 身分別 | `roles` 含 `teacher_1`／`teacher_2`／`teacher_3` 任一 → 「講師」，否則 → 「學員」 |
  | 講師編號 | 身分別為「講師」時 `teacherNo ?? ''`，「學員」時一律空字串 |
- 回應標頭：`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`、`Content-Disposition: attachment; filename="unrecovered-members-YYYY-MM-DD.xlsx"`。
- 不接受任何 query 參數（此匯出範圍固定）。

### 3. UI：`/admin/members` 加第三顆匯出按鈕

- `app/[locale]/(admin)/admin/members/page.tsx`：在現有「匯出 {N} 筆」「匯出全部」之後，加一顆 `Button asChild` → `<a href="/api/admin/members/unrecovered/export">匯出未找回帳號</a>`（`variant="outline"`，與「匯出全部」同級樣式）。此按鈕**不帶**目前搜尋 / 篩選參數。

### 4. 文件與版本號

- `doc/管理者操作手冊.md`：會員管理章節補「匯出未找回帳號」按鈕（欄位、範圍說明）；`doc/老師手冊.md`／`doc/學員手冊.md` 不涉及（純後台功能）——僅更新管理者手冊檔首版本 ＋ 日期。
- `config/version.json`：patch +1、`updatedAt` 改套用當日。
- `ai-context/07-current-tasks.md` 追加本 CR；`ai-context/03-architecture.md` 於 `app/api/admin/members/` 說明補新 route；`README-AI.md` 版本行同步。

## Capabilities

### Modified Capabilities
- `member-export`：新增「未找回帳號名冊 Excel 匯出」——`/admin/members` 提供「匯出未找回帳號」按鈕與 `GET /api/admin/members/unrecovered/export` Route Handler，匯出所有登入 Email 仍為 `@seed.iwillshare.org.tw` 的會員，含「啟動編號、真實姓名、Email、性別、所屬教會、授課老師、身分別（講師／學員）、講師編號」8 欄；非 admin 回 401。既有「匯出 N 筆 / 匯出全部 / 13 欄定義」需求不變。

## Impact

- **Affected code**：
  - 新增：`app/api/admin/members/unrecovered/export/route.ts`
  - 修改：`lib/data/members.ts`（加 `exportUnrecoveredSeedMembers()`）、`app/[locale]/(admin)/admin/members/page.tsx`（加按鈕）、`doc/管理者操作手冊.md`、`config/version.json`、`ai-context/03-architecture.md`、`ai-context/07-current-tasks.md`、`README-AI.md`
- **Database**：無 schema 變更（純讀取查詢）。
- **既有資料**：不涉及；純匯出。
- **UI / 行為**：`/admin/members` 多一顆匯出按鈕；點擊下載 `unrecovered-members-YYYY-MM-DD.xlsx`。無新頁面、無路由群組變更。
- **Route access**：新 API 位於 `app/api/admin/*`，由既有 middleware／admin 保護涵蓋，**不需**登錄至 `lib/auth/route-access.ts`（非免登入）。route handler 自行 `auth()` + `canAccessAdmin` 雙重把關。
- **i18n**：後台頁面與其專屬字串本階段維持繁體（依 CLAUDE.md 第 12 點「後台與其專屬字串本階段維持繁體」），新按鈕文字直接寫繁體，與現有「匯出全部」一致。
- **Dependencies**：無新增套件（`xlsx` 已用於 `member-export`）。

## Open Questions

- 無。範圍（全部 `@seed` 帳號）、按鈕位置（`/admin/members`）、授課老師欄（全部去重）皆已由使用者確認。

# 5. 關鍵業務邏輯

> 屬於 [README-AI.md](../README-AI.md) 拆分章節，回索引請見該檔。

### 認證流程（多層）
1. **Middleware** — 攔截未登入請求，導向 `/login?callbackUrl=<path>`；注入 `x-pathname` header 供 layout guard 使用
2. **Email 白名單** — Google OAuth callback 驗證 `WhitelistedEmail.isActive`
3. **臨時密碼攔截** — `isTempPassword=true` 強制導向 `/onboarding`（Onboarding Wizard）
4. **Profile Completion Guard** — `(user)/layout.tsx` 讀取 `REQUIRE_PROFILE_COMPLETION` 環境變數（預設 true）；啟用時若 `realName`/`phone` 缺失則導向 `/user/{spiritId}/profile?incomplete=1`；排除 `/profile`、`/onboarding` 路徑
5. **JWT** — 儲存 `id`, `roles`（多重身分陣列）, `spiritId`, `isTempPassword`（30 天）；授權判定一律走 `lib/auth-roles.ts`（`canAccessAdmin`/`canTeachBook`/`canTeachAny`/`isSuperadmin`/`hasRole`）
6. **登入後預設導向** — `/user/{currentUserId}`（學員專屬頁面）

### Spirit ID 核發
- 格式：`PA` + 年份後兩碼 + 4 位流水號（例 `PA261001`）
- 首次 Google 登入自動觸發核發

### 課程目錄管理
- `CourseCatalog` 為 DB 唯一來源（不使用 `config/course-catalog.ts`）
- Admin UI：`/admin/course-catalog`；可設定名稱、isActive、先修課程（多選）
- `isActive = true` 才可被選為開課目標
- 先修驗證：`checkPrerequisites(userId, catalogId)` 回傳未完成先修清單（空 = 通過）；格式化訊息共用 `formatMissingPrerequisites(missing)`。呼叫點：學員自行報名 `applyToCourse`、老師/管理者直接新增學員 `addStudentToInvite`（`cr-spec-260924-002`，檢查對象皆為被加入者本人，不因操作者角色豁免）
- 結業後 `InviteEnrollment.graduatedAt` 有值，`getGraduatedCatalogIds(userId)` 回傳 Set

### 身分標籤
- 來源：`User.roles`：`canAccessAdmin(roles)` → 「系統管理員」；書籍講師身分 `teacher_1`~`teacher_3` → 對應「{書名}講師」Badge（可多標籤）
- 講師標籤改由 `roles` 推導（不再以結業證書）；書名對應見 `lib/auth-roles.ts`（`BOOK_LABEL_BY_TEACHER_ROLE`）

### 開課身分驗證（依書籍綁定）
- 講師資格依書籍區分（`teacher_1`=啟動靈人、`teacher_2`=啟動豐盛、`teacher_3`=啟動得勝）；「身分↔書籍」對應集中於 `lib/auth-roles.ts`（`TEACHER_ROLE_BY_CATALOG`/`CATALOG_BY_TEACHER_ROLE`）
- 開課入口：`canTeachAny(roles)`（含任一書籍講師身分或 admin/superadmin）顯示／隱藏
- 逐書授課資格：`canTeachBook(roles, courseCatalogId)`（持有該書講師身分，admin/superadmin 豁免）；開課精靈 Step 1 與 `createCourseSession`/`createInvite` Server Action 皆以此把關，未具資格回傳「須具備{書名}講師身分才能授課」
- **管理者代講師新增授課**（`cr-spec-260828-002`）：管理者於**講師的個人頁**（`/user/{spiritId}`，頁主具任一 `teacher_*` 身分時顯示「授課」區塊）可代建立。`createCourseSession` 收選填 `targetTeacherId`：帶入時要求呼叫者 `canAccessAdmin`，且以 `hasRole(target.roles, TEACHER_ROLE_BY_CATALOG[courseCatalogId])`（**不套 admin 豁免**）驗證該老師實際持有該書身分，通過後 `CourseInvite.createdById = targetTeacherId`、「授課已建立」通知寄該老師；精靈 Step 1 對代建立情境不放行 admin 全選（`isAdmin && !onBehalf`）。人數上限仍以呼叫者（管理者）判定放寬。

### 新增授課精靈（三步驟）
1. **Step 1**：卡片式課程選擇（DB 課程列表；顯示先修條件說明）
2. **Step 2**：基本資料（課程名稱、人數、開課日期、截止日期、備註）
3. **Step 3**：預覽確認 → 呼叫 `createCourseSession` → 進入邀請學員階段
- **邀請階段**：複製課程連結 `/course/{id}` 或填寫 Spirit ID → `inviteBySpirtId` → 發送 Inbox 通知

### 課程詳情頁操作權限：該課講師 vs 管理者（`cr-spec-260828-002`）
- 判定基準：`isInstructor = (CourseInvite.createdById === 當前使用者)`；管理者＝`canAccessAdmin(roles)`。
- **管理者與該課講師一致可操作**（UI 與 Server Action 皆放寬為 `createdById === user || canAccessAdmin`）：核准待審報名（`approveEnrollment`）、開始上課（`startCourseSession`，開課門檻 `evaluateCourseStartGate` 不變）、講師資格回饋（`upsertInstructorFeedback`，限已結業學員）、公開媒合設定（`updateMatchSettings`，本即允許）、複製邀請連結、以及既有的編輯課程資訊／學員增減／教材作業／結業・重新招募・結業回退・取消／操作 LOG。
- 課程層通知（`cancelCourseSession`、代建立的 `createCourseSession`）收件人＝`invite.createdById`（該課講師），非操作的管理者。
- **不對齊（刻意）**：`CourseContactAdminButton`（聯繫管理者）仍為該課講師專屬；封存／刪除課程仍僅 `admin`/`superadmin`。

### 代填學員邀請與自動連結（`cr-feat-261022-003`）
- 建立代填學員（`addProxyStudentToInvite`）可選填邀請 email：唯一性檢查通過後寫入 `User.email`＋白名單，交易外核發 `ProxyInviteToken`（30 天、一次性）並 fire-and-forget 寄信（`sendProxyInviteEmail`），失敗僅 log 不回滾已建立的帳號。
- 補發／改信箱（`app/actions/admin.ts` 的 `updateProxyInviteEmail`／`resendProxyInvite`）：改信箱沿用 `account-email-change` 共通的 `validateNewAccountEmail`/`applyAccountEmailChange`；兩者皆先 `invalidatePendingTokens` 作廢該使用者先前未使用的 token（寫 `voidedAt`，不寫 `usedAt`），再核發新 token 重新寄信——恆「最新一封才有效」。
- 完成註冊（`/complete-registration?token=xxx`，免登入，見 `public-route-registry`）：`lib/data/proxy-invite.ts getActiveInviteForToken` 於**伺服器端**先驗證 token 有效（`usedAt`／`voidedAt` 皆為 null 且未過期）且對應 `User.isProxyMember === true`，無效時頁面直接不渲染密碼表單；送出由 `completeProxyRegistration`（`app/actions/auth.ts`）於單一交易內完成 `passwordHash` 寫入＋`isProxyMember → false`＋token `usedAt` 標記，**同一筆 `User`**，不建立新帳號。失效文案統一為「請聯繫啟動事工同工或是授課老師重新發送邀請」（`cr-feat-261023-001`）。
- Google OAuth 自動連結：`lib/auth.ts` 的 `jwt` callback 於既有 Google/LINE 分支內，`dbUser.isProxyMember` 為真時直接更新為 `false`（獨立判斷，不與 spiritId/姓名重試邏輯混用失敗路徑）；因既有 `allowDangerousEmailAccountLinking: true`，受邀 email 的 Google 登入會自動關聯到這筆既有帳號，此行只是解除其代填標記。LINE 與自助註冊（`registerWithEmail`）皆不比對/放寬既有「Email 已被使用即拒絕」規則，不作為認領代填帳號的管道。

### 代填學員邀請管理入口搬至會員首頁（`cr-feat-261023-001`）
- `updateProxyInviteEmail`／`resendProxyInvite` 的授權範圍自「僅 `canAccessAdmin`」放寬為「管理者，或該代填學員所屬班級的授課老師」：後者由 `lib/data/proxy-invite.ts isClassTeacherOfMember(teacherId, memberId)` 判定——該會員名下存在至少一筆 `InviteEnrollment`（不限 `status`），其 `CourseInvite.createdById` 為操作者本人。
- 操作入口自後台會員詳情頁「特殊設定」分頁移至該會員**自己的會員首頁**（`/user/[spiritId]`，新元件 `components/dashboard/proxy-invite-panel.tsx`）：僅當被檢視者 `isProxyMember === true` 且檢視者為管理者或其班級老師時，首頁才會渲染此區塊（置於「基本資料」之後、「課程」之前）；此頁已 i18n 化，新增 `studentProfile.proxyInvite.*` 命名空間。
- 後台會員詳情頁新增「未註冊會員專區」唯讀分頁（置於最前），僅顯示 `getProxyInviteHistory(userId)` 歷史列表（核發時間、email、狀態、過期時間），對所有會員恆顯示、不隨完成註冊而隱藏，供管理者稽核；不再提供任何編輯元件。

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

### 講師身分授予前置檢查（`cr-fix-261024-001`）
- 新增書籍講師身分（`teacher_1`～`teacher_3`）前，SHALL 以 `hasGraduatedBook(userId, courseCatalogId)`（`lib/data/teacher-eligibility.ts`，查對應 `courseCatalogId` 之 `InviteEnrollment.graduatedAt` 非空）確認本人已結業對應書籍，未通過拒絕並回傳「此會員尚未結業《書名》，無法授予此講師身分」。套用於 `grantTeacherRole`（講師身分分頁卡片授予）與 `updateMemberRoles`（新增講師身分時）兩個 Server Action；移除身分與 `admin`/`superadmin` 的加掛/移除不受此限。
- 「新增會員」（`createMember`）身分勾選**不提供**書籍講師身分（`createMemberSchema.roles` 僅 `['admin','superadmin']`）——新帳號必然尚無結業紀錄，規則上永遠無法通過此檢查，須待本人結業後再經上述入口授予。
- 緣由：代數計算（見「世代倍增」章節）以「本人最早一筆已結業紀錄所屬班級建立者」為 mentor，未結業者取得講師身分／開班會導致師徒鏈斷裂、被誤判為根節點（第 0 代）。

### 世代倍增教師資格認定（`cr-fix-261024-002`）
- 月報「世代倍增」（`lib/data/monthly-report.ts` `generations()`／`generationTeacherDetails()`）的**候選教師集合**＝在 cutoff 前曾建立過啟動靈人 `CourseInvite` 者（不要求班上已有人結業）；**教師集合**＝候選中**本人在 cutoff 前也至少有一筆啟動靈人已結業紀錄**（`mentorOf.has(t)` 即代表此條件，複用既有 Map 不另查詢）者才列入；不符合者（如本人結業時間晚於其帶出學生的結業時間，恰好落在某月 cutoff 之後，或本人尚未結業但已開班）**整列不出現**於該月報表的長條圖統計，而非被誤判為第 0 代。
- **固定例外**：`SYSTEM_ROOT_SPIRIT_ID = 'PA260001'`（黃國倫，系統創始人，正式環境本人無任何啟動靈人結業紀錄）永遠視為合格、固定落在第 0 代，以 `getSystemRootUserId()` 依 spiritId 查一次 `userId` 比對，不寫死 UUID。
- 月份 cutoff 的「世代隨月份連動」設計本身不受影響（`cr-fix-261024-001` 已討論過改用全量資料的方案並確認不採用）。
- 候選教師集合原本要求「使至少一人於 cutoff 前結業」，後收斂為「只要開過啟動靈人班即列入候選」——理由：講師分析卡片的「啟動講師」與「世代倍增」教師人數原本口徑差異過大（509 vs 178），前者僅看 `teacher_1` 身分旗標，不需任何開課或結業條件；收斂候選範圍讓兩者更可比，但仍保留「本人也須已結業」的收斂條件以避免根節點誤判。
- 同一批修改亦修正後台儀錶板「講師分析」卡片的「已開課」人數（`lib/data/dashboard.ts` `getDashboardStats()`）：原本未依冊別篩選（`courseInvites: { some: {} }`，任一冊課程都算），改為依講師身分對應冊別篩選（`teacher_1`→`courseCatalogId=1`、`teacher_2`→2、`teacher_3`→3）。
- `generationTeacherDetails()` 本身不再供 raw data 下載使用（見下方「世代倍增 raw data 巢狀階層匯出」），僅畫面長條圖統計與 `generations()` 共用其教師集合口徑。

### 世代倍增 raw data 巢狀階層匯出（`cr-feat-261112-002`）
- 「世代倍增」下載 raw data（`app/api/admin/dashboard/generations/export/route.ts`）改用 `lib/data/monthly-report.ts` 新增的 `generationHierarchyRows()`，由平鋪逐教師明細改為巢狀階層樹狀 Excel。
- 範圍刻意比畫面長條圖的教師集合更廣：反轉既有 `mentorOf`（學員→其最早結業對應的教師）建立 `childrenOf`（教師→直屬下線），**涵蓋所有已結業學員**，不要求本人也須開課或已結業才能成為樹的節點（只要求「有直屬下線」才會被列為非葉節點）。
- 根節點＝有直屬下線、且本人無上線（或上線為自己）者；每個根節點各自展開一棵樹，深度優先排列，子節點依各自最早結業時間升冪排序。
- 節點顯示：**所有節點一律**顯示「啟動編號 姓名(暱稱) 講師編號」（`labelWithName()`，任一欄位缺值僅省略該欄位，不分是否有下線、不分是否具教師身分）；有直屬下線者另＋人數，葉節點不標示人數。深度優先展開沿用既有 `MAX_GEN` 常數防護環路與深度上限。
- `labelWithName()` 簽章為 `(spiritId, realName, nickname, teacherNo, fallbackId)`，`generationTeacherDetails()` 的 `teacherLabel`／`mentorLabel` 共用同一函式（雖目前無人呼叫該函式，仍保持格式一致以備未來重啟用）。
- 判斷依據變更歷程（同一輪使用者回饋，依序收斂）：①初版僅依 `directChildCount > 0` 決定是否套用完整格式，葉節點僅顯示姓名；②使用者發現「方光瑋」（具教師身分但該世代鏈中沒有直屬下線）被誤判為一般學員葉節點，改為「有下線 **或** 本人具教師身分」雙條件判斷；③使用者接著發現「周恬伃」（不具教師身分的一般學員葉節點）仍只顯示姓名，確認是雙條件下的正確行為後，決定不再區分任何條件，所有節點一律套用完整格式（最終版本，取代①②）。多數已結業學員皆有 `spiritId`，故此變更後葉節點不再僅顯示姓名，不再完全比照使用者最初提供的截圖樣式——這是使用者明確要求的最終決定。
- Excel 輸出改用 `lib/utils/xlsx-export.ts` 新增的 `xlsxAoaDownloadResponse()`（`aoa_to_sheet`，依深度分欄），不影響既有 `xlsxDownloadResponse()`（`json_to_sheet`）供其他匯出端點（會員清單、未找回帳號清單）使用。
- 此匯出與「世代倍增」長條圖統計涵蓋範圍不同，兩者數字不要求逐項可互相核對（刻意的設計取捨，非口徑不一致）。

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

### 學員首頁「加好友／傳訊息」按鈕移至學習進度下方（`cr-feat-261023-003`）
- 他人視角的「傳訊息」按鈕自基本資料姓名列移除，改於「學習進度」三卡區塊下方顯示；新增 `components/conversation/profile-friend-actions.tsx`（client），依好友狀態切換顯示「加好友」（呼叫既有 `addFriendByUserId`）或「傳訊息」（既有 `SendMessageButton`），加好友成功後即時切換、不整頁刷新。
- `page.tsx` 於 `!isOwnPage` 時以 `lib/data/friendship.ts isFriend(session.user.id, user.id)` 查詢好友狀態作為 `initialIsFriend` 傳入。

### 學員首頁基本資料新增性別／所屬教會顯示（`cr-feat-261023-004`）
- 基本資料區塊於 Spirit ID 列與身分標籤列之間新增「性別」（重用 `GenderIcon`）與「所屬教會」兩列，對所有檢視者（本人與他人）一致公開顯示（與使用者確認不需隱私限制）。
- 所屬教會三態就地於 `page.tsx` 計算（不抽共用 helper）：`churchType === 'church'` 顯示 `church.name`；`churchType === 'other'` 顯示 `churchOther`；否則顯示 `studentProfile.churchUnset`（「未設定」）。

### 分段式查經可見性規則：同班／好友唯讀查看（`cr-feat-261116-001`）
- 需求：讓同班同學與社群好友能互相唯讀查看彼此的「分段式查經」（`LearningStudyEntry`）筆記，取代原本「僅本人可見」的限制。設計上**不異動 `LearningStudyEntry` 資料表結構**，不新增欄位、不做 backfill，可見範圍改為查詢時動態判斷。
- `lib/data/learning-study.ts` 新增 `getViewableLearningCatalogIds(viewerId, authorId)`／`canViewLearningCatalog(viewerId, authorId, courseCatalogId)`：三條件任一成立即可見——①本人；②好友（`isFriend(viewerId, authorId)`，複用 `lib/data/friendship.ts` 既有單向好友判斷，符合時 author**已解鎖的全部課程目錄**皆可見）；③同班（author 與 viewer 在同一 `CourseInvite`（`inviteId`）下皆為 `status = approved` 且該開課未取消的報名，僅該課程目錄可見）。
- 已知取捨：若 author 同一課程目錄有多筆 approved 報名（上過兩梯），因筆記未記錄撰寫當下對應哪一次開課，該目錄對兩梯同學一律皆可見全部筆記，不區分梯次（已與需求方確認可接受，且已以正式資料結構相同的 dev DB 真實資料驗證此行為）。
- 路由層：`/user/{spiritId}/learning` 與 `/user/{spiritId}/learning/{catalogId}` 非本人存取時，先查可見性——可見則以唯讀模式顯示（不渲染任何新增/編輯表單或按鈕，`LessonAccordion`/`LessonEntriesPanel`/`StudyEntryCard` 皆新增 `readOnly` prop），不可見則維持原有「導回查看者本人對應路由」行為。管理者後台不提供任何檢視入口，維持原有排除。
- 個人首頁學習進度三卡（`CourseProgressCards`）的 `linkable` 條件從「僅本人」放寬為「本人或該課程目錄在 `viewableCatalogIds` 內」，與上述可見性規則一致；完成度數字本身維持公開不受影響。
- `createStudyEntry`／`updateStudyEntry` 既有的登入與擁有者驗證**未異動**，本次純屬新增讀取路徑。

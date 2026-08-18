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
- 先修驗證：`checkPrerequisites(userId, catalogId)` 回傳未完成先修清單（空 = 通過）
- 結業後 `InviteEnrollment.graduatedAt` 有值，`getGraduatedCatalogIds(userId)` 回傳 Set

### 身分標籤
- 來源：`User.roles`：`canAccessAdmin(roles)` → 「系統管理員」；書籍講師身分 `teacher_1`~`teacher_3` → 對應「{書名}講師」Badge（可多標籤）
- 講師標籤改由 `roles` 推導（不再以結業證書）；書名對應見 `lib/auth-roles.ts`（`BOOK_LABEL_BY_TEACHER_ROLE`）

### 開課身分驗證（依書籍綁定）
- 講師資格依書籍區分（`teacher_1`=啟動靈人、`teacher_2`=啟動豐盛、`teacher_3`=啟動得勝）；「身分↔書籍」對應集中於 `lib/auth-roles.ts`（`TEACHER_ROLE_BY_CATALOG`/`CATALOG_BY_TEACHER_ROLE`）
- 開課入口：`canTeachAny(roles)`（含任一書籍講師身分或 admin/superadmin）顯示／隱藏
- 逐書授課資格：`canTeachBook(roles, courseCatalogId)`（持有該書講師身分，admin/superadmin 豁免）；開課精靈 Step 1 與 `createCourseSession`/`createInvite` Server Action 皆以此把關，未具資格回傳「須具備{書名}講師身分才能授課」

### 新增授課精靈（三步驟）
1. **Step 1**：卡片式課程選擇（DB 課程列表；顯示先修條件說明）
2. **Step 2**：基本資料（課程名稱、人數、開課日期、截止日期、備註）
3. **Step 3**：預覽確認 → 呼叫 `createCourseSession` → 進入邀請學員階段
- **邀請階段**：複製課程連結 `/course/{id}` 或填寫 Spirit ID → `inviteBySpirtId` → 發送 Inbox 通知

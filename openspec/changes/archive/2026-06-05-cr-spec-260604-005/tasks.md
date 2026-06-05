## 1. 資料模型與遷移

- [x] 1.1 於 `prisma/schema/user.prisma` 的 `UserRole` enum 新增 `teacher`
- [x] 1.2 在 `User` 新增 `roles UserRole[] @default([user])` 欄位
- [x] 1.3 撰寫 migration：backfill 既有資料（`user → {user}`、`admin → {user,admin}`、`superadmin → {user,superadmin}`），backfill 完成後 drop 舊 `role` 欄位
- [x] 1.4 執行 migration 並驗證 DB 欄位與既有資料正確遷移（25×`{user}`、1×`{user,superadmin}`）

## 2. 授權 helper（member-roles）

- [x] 2.1 新增 `lib/auth-roles.ts`，實作 `hasRole`、`canAccessAdmin`、`isSuperadmin`、`canTeach`，並導出身分顯示用 label 對應（一般會員/講師/管理者/超級管理者）
- [x] 2.2 補上「身分集合恆含 `user` 基線」的工具（normalize：確保結果含 `user`）

## 3. 認證／Session 串接

- [x] 3.1 `lib/auth.ts`：兩處 select 由 `role` 改為 `roles`，token 寫入 `token.roles`（取代 `token.role`）
- [x] 3.2 `lib/auth.ts` session callback：`session.user.roles = token.roles`（移除 `session.user.role`）
- [x] 3.3 `types/next-auth.d.ts`：`role: string` 改為 `roles: string[]`

## 4. 守衛改寫（全面以 helper 取代 role 判斷）

- [x] 4.1 `middleware.ts`：僅檢查 session cookie（後台存取守衛在各頁面 RSC，已改用 helper）
- [x] 4.2 後台頁面守衛改用 helper：`app/(user)/admin/**`（page/dashboard/settings/members/materials/course-sessions）+ layout/topbar/settings-tabs/user 個人頁
- [x] 4.3 Server Actions 守衛改用 helper：`admin.ts`、`admin-settings.ts`、`church.ts`、`course-catalog.ts`、`course-order.ts`、`course-session.ts`、`course-invite.ts`
- [x] 4.4 全庫搜尋並清除殘留的 `role ===`／`session.user.role` 用法（僅餘 helper 與 `roles`）

## 5. 會員資料層與列表

- [x] 5.1 `lib/data/members.ts`：`searchMembers`、`getMemberDetail`、`exportMembers` 的 select 以 `roles` 取代 `role`
- [x] 5.2 會員列表 UI：移除「加入日期」欄位，新增「身分」欄位（以 badge 顯示所有身分），欄位順序為 啟動編號、姓名、Email、身分、操作
- [x] 5.3 會員匯出（`member-export`）：身分欄改輸出所有身分

## 6. 後台新增會員

- [x] 6.1 新增 `createMember` Server Action：`canAccessAdmin` 守衛、Zod 驗證（姓名/Email/身分）、Email 唯一性檢查
- [x] 6.2 `createMember` 流程：以 `generateSpiritId()` 核發 spiritId → 產生隨機臨時密碼並 `bcrypt` 雜湊 → 建立 `User`（roles、isTempPassword=true、passwordHash）→ 寫入 `WhitelistedEmail`（isActive=true）→ 回傳臨時密碼
- [x] 6.3 `/admin/members` 新增「新增會員」入口與表單 Dialog（姓名、Email、身分複選），送出後顯示臨時密碼一次

## 7. 會員身分編輯與密碼重設（詳情頁）

- [x] 7.1 新增身分編輯 Server Action：`canAccessAdmin` 守衛、保留 `user` 基線、禁止移除「自己」的 `admin`/`superadmin`（回傳 `無法移除自己的管理員身分`）
- [x] 7.2 詳情頁 UI：身分複選編輯（含自身管理身分的停用防呆），顯示所有身分
- [x] 7.3 擴充 `resetMemberPassword`：重設後回傳新臨時密碼供畫面重新顯示（不僅寄 Email）

## 8. 開課權限（講師身分）

- [x] 8.1 `app/actions/course-session.ts`（及 `course-invite.ts`）建立流程加入 `canTeach` 判定，未具資格回傳 `需具講師身分方可開課`
- [x] 8.2 首頁「新增開課」入口依 `canTeach` 顯示／隱藏（UI 層）

## 9. 收尾與驗證

- [x] 9.1 `npm run build` TypeScript 型別檢查通過（全部 25+ 檔案）；註：prerender 階段於 `/admin/churches`（未改動的 redirect shim）有既有 useContext null 失敗，與本次變更無關。`npm run lint` 因專案既有 ESLint v9 設定缺失無法執行（非本次造成）
- [ ] 9.2 手動驗證：新增會員可登入並強制改密、身分編輯即時生效、自身管理身分無法移除、非講師無法開課、列表/匯出身分顯示正確（待使用者於 dev 環境驗證）
- [x] 9.3 依 `.ai-rules.md` 更新 `README-AI.md`，並將 `config/version.json` patch +1（0.1.68 → 0.1.69）

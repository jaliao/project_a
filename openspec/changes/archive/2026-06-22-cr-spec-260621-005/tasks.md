## 1. 資料模型（Prisma）

- [x] 1.1 `prisma/schema/user.prisma`：`User` 新增 `suspendedAt DateTime?`、`suspendedById String? @db.Uuid`、`suspendReason SuspendReason?`、`suspendReasonNote String?`；新增 `enum SuspendReason { password_leak user_request other }`
- [x] 1.2 `make schema-update name=add_member_suspension`（容器內 migrate dev）產生 migration 並重生 client

## 2. 暫停登入封鎖

- [x] 2.1 `lib/auth.ts`：Credentials `authorize` 與 Google `signIn` callback 查 `suspendedAt != null` → 拒絕登入（帳號已暫停）
- [x] 2.2 `(user)/layout.tsx`：每請求查 `suspendedAt`，暫停中 → 導向 `/login?error=Suspended`（既有 session 即時擋下）
- [x] 2.3 登入頁顯示 `error=Suspended` 提示文案

## 3. Server Actions

- [x] 3.1 `app/actions/admin.ts`：`suspendMember(userId, { reason, note })`（admin；reason 為 SuspendReason，other→note 必填；寫 suspendedAt/ById/Reason/Note）
- [x] 3.2 `unsuspendMember(userId)`（admin；清空暫停四欄位）
- [x] 3.3 `grantTeacherRole(userId, role)` / `revokeTeacherRole(userId, role)`：授予/移除 teacher_1~3；授予成功後寄通知信（`resolveContactEmail`，await + try/catch 不影響授權）
- [x] 3.4 特殊身分授權：授予/移除 `admin`/`superadmin`，套用權限分級守衛（admin 不可碰 superadmin；不可移除自己）；`updateMemberRoles` 既有路徑一併加守衛
- [x] 3.5 共用權限判定 helper（依操作者 roles 決定可授予的目標身分集合），集中於 `lib/auth-roles.ts`

## 4. 寄信

- [x] 4.1 `lib/mailer.ts`：`sendTeacherRoleGrantedEmail(to, bookLabel)`（沿用 transporter/FROM）

## 5. 資料查詢

- [x] 5.1 `lib/data/members.ts`：詳情查詢帶出暫停欄位（含 `suspendedBy` 顯示名稱）與推薦歷程（`InviteEnrollment.teacherRecommended=true` where 此會員，join 書別＋推薦老師＋時間）

## 6. 詳情頁四分頁 UI

- [x] 6.1 `app/(user)/admin/members/[id]/page.tsx`：改為四分頁 info／hierarchy／teacher／special（基本資料含學習紀錄、學習階層沿用）
- [x] 6.2 講師身分分頁：推薦歷程（唯讀清單）＋講師卡片授權（點擊→確認 Dialog→grant/revoke），新元件
- [x] 6.3 特殊設定分頁：暫停會員（原因下拉＋自填 Dialog）／恢復會員、補發密碼（沿用）、特殊身分授權（admin/superadmin；對 admin 隱藏 superadmin 操作）
- [x] 6.4 暫停中會員於特殊設定顯示暫停時間/操作人/原因＋「恢復會員」

## 7. 驗證

- [x] 7.1 `npm run build` 通過（tsc 無錯誤）
- [x] 7.2 〔待實機 UI〕端到端：四分頁顯示；授予講師身分→收到通知信（測試集中 justin@）；暫停會員→該帳號無法登入（顯示暫停）→恢復→可登入
- [x] 7.3 〔待實機 UI〕權限：admin 無法授 superadmin（UI 隱藏＋server 拒絕）；superadmin 可授全部；不可移除自己管理身分；暫停 other 未填補充被擋

## 8. 收尾

- [x] 8.1 依 CLAUDE.md 第 9 點更新 `doc/管理者操作手冊.md`（會員詳情四分頁、講師身分授權、暫停/恢復、特殊身分授權權限分級）；README-AI 同步
- [x] 8.2 apply 時將 `config/version.json` patch 版本號 +1

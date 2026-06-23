## 1. Schema 與 Migration

- [x] 1.1 於 `prisma/schema/user.prisma` 的 `User` 新增 `previousLoginAt DateTime?`（緊鄰 `lastLoginAt`）
- [x] 1.2 執行 `make prisma-dev-migrate name=add_previous_login_at`（於 web 容器內跑 `migrate dev`，可達容器網路 DB）建立並套用 migration、重新產生 Prisma client

## 2. 登入時間記錄（login-activity-tracking）

- [x] 2.1 於 `lib/auth.ts` 的 `signIn` callback，通過暫停守衛後以原子 SQL 平移登入時間：`UPDATE "users" SET "previousLoginAt" = "lastLoginAt", "lastLoginAt" = NOW() WHERE id = $userId`（用 `prisma.$executeRaw`）
- [x] 2.2 沿用既有 where 推導定位 user id（`user.id` 優先，否則以 `user.email` 查 id），Google 與 Credentials 皆涵蓋
- [x] 2.3 以 try/catch 包覆登入時間更新，失敗僅記錄錯誤、不阻斷登入

## 3. 資料層（lib/data/members.ts）

- [x] 3.1 會員詳情查詢 select 增加 `previousLoginAt`、`lastLoginAt`、`realName`、`phone`、`isTempPassword`，並以布林帶出 `passwordHash` 存在性（不外流雜湊值）
- [x] 3.2 `exportMembers` 的 select 增加 `previousLoginAt`、`isTempPassword` 與 `passwordHash`（同樣只取存在性），`lastLoginAt`／`realName`／`phone` 已有則沿用

## 4. 會員詳情頁活躍度指標（admin-member-management）

- [x] 4.1 於 `app/(user)/admin/members/[id]/page.tsx` 基本資料分頁新增「最後登入時間」「上次登入時間」（無值顯示「—」）
- [x] 4.2 新增「是否完成首次登入」（`lastLoginAt != null` → 已完成／尚未登入）
- [x] 4.3 新增「是否完成首次補填基本資料」（`realName && phone` → 已補填／尚未補填）
- [x] 4.4 新增「是否已更改臨時密碼」（`passwordHash == null` → 不適用；否則依 `isTempPassword` → 尚未更改／已更改）

## 5. Excel 匯出欄位

- [x] 5.1 於 `app/api/admin/members/export/route.ts` 新增「上次登入」「已完成首次登入」「已完成首次補填」「已更改臨時密碼」欄，判定規則與詳情頁一致（「最後登入」欄保留）

## 6. 文件與版本

- [x] 6.1 更新 `doc/管理者操作手冊.md`（會員詳情頁活躍度指標與匯出欄位說明，含「不適用」情形），更新檔首版本標註與日期
- [x] 6.2 `config/version.json` patch 版本號 +1
- [x] 6.3 依 `.ai-rules.md` 重新產生 `README-AI.md`（反映新欄位與資料模型）

## 7. 驗證

- [x] 7.1 `npm run build` 通過（含 TS 型別檢查）；`npm run lint` 可執行（本變更檔案皆無 lint 問題；既有 2 errors 在 `course-session-form.tsx`，與本變更無關）
- [x] 7.2 手動驗證：新建 Email 會員首次登入後 `lastLoginAt` 有值、再次登入 `previousLoginAt` 正確平移；Google 帳號「已更改臨時密碼」顯示「不適用」（待使用者於瀏覽器登入驗證）

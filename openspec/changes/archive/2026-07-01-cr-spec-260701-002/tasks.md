## 1. 資料模型與 migration

- [x] 1.1 `prisma/schema/course-invite.prisma`：`InviteEnrollment` 新增 `recommendDeferredAt`、`recommendDeferredById @db.Uuid`、`recommendDeferralNote`＋`recommendDeferredBy`（"RecommendDeferredBy"）
- [x] 1.2 `prisma/schema/user.prisma`：`User` 補反向關聯 `deferredRecommendations`
- [x] 1.3 migration `20260701020000_add_recommend_deferral` ＋ `prisma generate`（DB 套用見 7.3）

## 2. 資料層

- [x] 2.1 `lib/data/recommendation.ts` `getRecommendationList`：`teacherRecommended=true`、`orderBy teacherFeedbackAt desc`、含 user roles/顯示名/spiritId、invite catalog/老師、deferredBy
- [x] 2.2 JS 狀態推導（accepted＝角色含 `TEACHER_ROLE_BY_CATALOG` > deferred > pending）＋篩選＋分頁
- [x] 2.3 `getPendingRecommendationCount()`
- [x] 2.4 `lib/data/course-order.ts` `getMaterialTodoCount()`（共用 `getMaterialOrderStatusKey`，計 quote/confirm/ship）

## 3. Server Actions（`app/actions/recommendation.ts`，`canAccessAdmin`）

- [x] 3.1 `deferRecommendation(enrollmentId, note)`：記錄時間/管理者/備註
- [x] 3.2 `undeferRecommendation(enrollmentId)`：清除（回未處理）
- [x] 3.3 `revalidatePath('/admin/recommendations')` 與 `/admin`

## 4. 推薦講師頁（`admin/recommendations/page.tsx`）

- [x] 4.1 server component，`searchParams { status?='pending', page? }`
- [x] 4.2 表格欄：被推薦人（顯示名＋啟動編號）、推薦書別、推薦老師、回饋備註、回饋時間、狀態、操作、會員
- [x] 4.3 狀態分頁（未處理/暫不接受/已成為講師/全部）＋分頁
- [x] 4.4 每列「查看會員」另開新視窗（`target=_blank`）
- [x] 4.5 `recommendation-actions.tsx`：pending→暫不接受（備註＋確認）、deferred→取消暫不接受、accepted 唯讀

## 5. 儀錶板動態副標題

- [x] 5.1 `admin/page.tsx` 計 `getPendingRecommendationCount()`／`getMaterialTodoCount()`
- [x] 5.2 新增「推薦講師」卡（`IconUserStar` → `/admin/recommendations`）；>0 顯示提示、=0 預設
- [x] 5.3 「教材作業」卡副標題 >0 顯示待辦數、=0 預設

## 6. 文件與版本

- [x] 6.1 `doc/管理者操作手冊.md` 新增「十五、推薦講師管理」＋儀錶板提示＋權限速查＋TOC＋版本 v0.1.109；老師/學員手冊不受影響
- [x] 6.2 `config/version.json` → 0.1.109；README-AI 同步

## 7. 驗證

- [x] 7.1 `npm run build`（✓ Compiled，路由已註冊）、`npm run lint`（0 errors）通過
- [x] 7.2 （執行階段，需 DB）已推薦列出；指派身分→「已成為講師」並脫離未處理；暫不接受/取消記錄正確；另開視窗；儀錶板兩卡數字正確
- [x] 7.3 （部署）DB 套用 migration：本機 `make prisma-dev-deploy`；VPS3 `make prisma-vps3-deploy`

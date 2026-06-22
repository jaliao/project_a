## Context

會員詳情頁 `app/(user)/admin/members/[id]/page.tsx` 現為兩分頁（基本資料含學習紀錄、學習階層），身分編輯由 `updateMemberRoles`（`app/actions/admin.ts`）處理，補發密碼為 `resetMemberPassword`。`lib/auth-roles.ts` 為身分授權單一來源（三本書講師：teacher_1~3 + admin/superadmin）。講師資格回饋（`InviteEnrollment.teacherRecommended`/`teacherFeedbackNote`/`teacherFeedbackAt`）已存在。`User` 目前無暫停相關欄位；登入經 `lib/auth.ts`（Credentials authorize + Google signIn callback + jwt/session）。寄信有 `resolveContactEmail` 通用規則。

## Goals / Non-Goals

**Goals:**
- 詳情頁四分頁；講師身分卡片授權（確認＋授予發信）；推薦歷程唯讀；特殊設定（暫停／補發密碼／特殊身分授權）。
- 暫停＝封鎖登入＋紀錄＋可恢復；身分授權權限分級（admin 不可授 superadmin）。

**Non-Goals:**
- 不做暫停到期自動恢復（無限期，手動恢復）。
- 不改學習階層／學習紀錄既有邏輯（僅移動分頁位置）。
- admin/superadmin 授權不發信（僅講師身分授予發信）。

## Decisions

### 決策 1：暫停資料模型與 enum
`User` 新增 `suspendedAt DateTime?`、`suspendedById String? @db.Uuid`、`suspendReason SuspendReason?`、`suspendReasonNote String?`。新增 `enum SuspendReason { password_leak, user_request, other }`。`suspendedAt != null` 即視為暫停中；恢復＝清空四欄位。`other` 時 `suspendReasonNote` 必填；其餘可選填補充。
- 「操作人員」= `suspendedById`（執行暫停的管理者）。

### 決策 2：登入封鎖點
被暫停者 SHALL 無法登入：
- Credentials `authorize`：查到 `suspendedAt != null` → 拒絕登入（回對應錯誤）。
- Google `signIn` callback：同樣擋下。
- 既有 session：`(user)/layout.tsx`（每請求讀 DB）若 `suspendedAt != null` → 登出／導向帶原因提示頁（如 `/login?error=Suspended`）。
- 與既有「白名單 / isTempPassword / profile completion」守衛並列，集中於 auth 流程與 layout。

### 決策 3：身分授權拆分與權限分級（單一守衛）
- **講師身分**（teacher_1~3）：於「講師身分」分頁卡片操作，呼叫 `grantTeacherRole(userId, role)` / `revokeTeacherRole(userId, role)`；授予成功後寄「{書名}講師資格授權通知」信（`resolveContactEmail`，fire-and-forget 後 await 確保送出、失敗不影響授權）。
- **特殊身分**（admin/superadmin）：於「特殊設定」分頁操作。
- **權限守衛**（server-side，所有身分授權共用）：
  - `admin` 可授予/移除 `teacher_*`、`admin`；SHALL NOT 授予/移除 `superadmin`。
  - `superadmin` 可授予/移除所有身分。
  - 沿用既有「不可移除自己 admin/superadmin」防呆。
- 既有 `updateMemberRoles` 加上 superadmin 守衛；新增細粒度 action 共用同一權限判定（集中於 `lib/auth-roles.ts` 或 action 層 helper）。

### 決策 4：推薦歷程資料來源
查 `InviteEnrollment` where `userId = 此會員` 且 `teacherRecommended = true`，join 課程（書別＝`CourseInvite.courseCatalogId`）與推薦老師（`CourseInvite.createdBy`），顯示書別、備註、推薦老師、時間。唯讀。

### 決策 5：分頁與元件
詳情頁 `Tabs`：`info`（基本資料）、`hierarchy`（學習階層，沿用）、`teacher`（講師身分）、`special`（特殊設定）。學習紀錄維持於基本資料或併入適當分頁（沿用現有位置即可，不破壞）。新元件：講師身分卡片＋確認 Dialog、暫停 Dialog（原因下拉＋自填）、特殊身分授權區。確認對話框用既有 AlertDialog/Dialog 模式。

### 決策 6：授權即時生效
身分變更沿用既有機制（JWT callback 每請求自 DB 同步 roles），無需該會員重新登入。

## Risks / Trade-offs

- [暫停 enum 為破壞性 schema 變更（新增 enum 不破壞）] → 新增 enum＋nullable 欄位，非破壞；migration 直接套用（必要時依 CLAUDE.md「破壞性 schema 變更」程序，但本案為新增故一般 `make schema-update` 即可）。
- [被暫停者既有有效 session] → layout 每請求查 DB 即時擋下，不必等 token 過期。
- [admin 嘗試授權 superadmin] → server 守衛拒絕並回錯誤；UI 對 admin 隱藏 superadmin 操作（雙層）。
- [講師授權信寄送失敗] → await＋try/catch，授權已先寫入，失敗僅 log。

## Migration Plan

`user.prisma` 新增暫停欄位＋`SuspendReason` enum → `make schema-update name=add_member_suspension`（容器內 migrate dev）。其餘為程式變更，部署即生效。回滾＝還原 schema 與程式。

## Open Questions

無。

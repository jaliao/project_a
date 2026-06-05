## Context

現行身分以 `User.role`（單一 `UserRole` enum：`user` / `admin` / `superadmin`）表示，並在多處硬編碼判斷 `role === 'admin' || role === 'superadmin'`。`lib/auth.ts` 採 JWT 策略，且**每次請求都會從 DB 重新同步 `role`**（`lib/auth.ts` jwt callback 後續請求分支），因此身分變更可即時生效、無需重新登入。會員目前僅能透過 Google OAuth／Credentials 登入，登入資格由 `WhitelistedEmail` 控管；密碼以 `bcryptjs` 雜湊，臨時密碼以 `isTempPassword` 標記。

本次需求：(1) 身分改為可同時持有多種——一般會員 / 講師 / 管理者 / 超級管理者；(2) 後台可建立可登入的會員；(3) 會員列表移除加入日期、改顯示所有身分；(4) 開課需具「講師」身分。

## Goals / Non-Goals

**Goals:**
- 以最小破壞面把單一 `role` 改為多重身分集合，並保留「每請求同步、即時生效」特性。
- 提供集中式授權 helper，取代散落各處的 `role === ...` 判斷。
- 後台新增會員：建立 User + 臨時密碼 + 白名單，首次登入強制改密。
- 開課（建立 `CourseInvite`）以「具講師身分」為前置條件。

**Non-Goals:**
- 不建立通用 RBAC／自訂權限系統（身分固定四種）。
- 不做身分指派的稽核紀錄（assignedBy／時間軸）。
- 不改變既有的 spiritId 產生規則與 Google OAuth 流程。
- 不實作以 Email 寄送臨時密碼（本次由後台顯示給管理者轉交）。

## Decisions

### 1. 身分儲存：Postgres enum 陣列 `roles UserRole[]`（取代 `role`）
在 `UserRole` enum 新增 `teacher`，並將 `User.role` 改為 `roles UserRole[] @default([user])`。
- **為何**：身分僅四種且固定，不需指派 metadata；Postgres 原生 enum 陣列支援 `has`／`hasSome` 查詢，JWT/session 只需從 `string` 改為 `string[]`，改動面最小。
- **替代方案**：
  - 獨立 `UserRoleAssignment` join table —— 提供稽核與彈性，但對四種固定身分過度設計，且查詢／JWT 都變重。
  - 多個 boolean 旗標（isTeacher/isAdmin…）—— 不可擴充、查詢醜、與「身分集合」語意不符。
- **基線約定**：每位會員的 `roles` SHALL 至少包含 `user`（一般會員為基底），`teacher`／`admin`／`superadmin` 為加掛身分。

### 2. 集中式授權 helper
新增 `lib/auth-roles.ts`（或併入既有 auth utils），提供：
- `canAccessAdmin(roles)` = 含 `admin` 或 `superadmin`
- `isSuperadmin(roles)` = 含 `superadmin`
- `canTeach(roles)` = 含 `teacher` 或 `admin` 或 `superadmin`
- `hasRole(roles, role)` 泛用判定
所有 `app/(user)/admin/**`、`app/actions/**`、`middleware.ts` 的守衛改用這些 helper。
- **為何**：單一真實來源，避免日後身分語意（例如「管理者是否可開課」）散落不一致。
- **決定**：管理者／超級管理者**視同具開課權限**（`canTeach` 為真），符合 proposal「講師（或管理者／超級管理者）」。

### 3. Session/JWT 型別調整
`token.role: string` → `token.roles: string[]`；`session.user.role` → `session.user.roles`；`types/next-auth.d.ts` 同步。`lib/auth.ts` 兩處 select 由 `role` 改 `roles`。
- **為何**：每請求同步機制會在使用者下次請求時自動以 `roles` 重寫 token，舊 session 平滑升級，無需強制登出。

### 4. 後台新增會員 Server Action
`createMember(input)`——僅 `canAccessAdmin` 可呼叫。流程：以既有 `generateSpiritId()`（`lib/spirit-id.ts`，原子核發 `PA+YY+XXXX`）核發 `spiritId` → 產生隨機臨時密碼 → `bcrypt` 雜湊 → 建立 `User`（`spiritId`、`roles`、`isTempPassword=true`、`passwordHash`）→ 寫入 `WhitelistedEmail`（`isActive=true`）→ 回傳產生的臨時密碼供管理者轉交（建立後顯示一次）。Email 唯一性衝突回傳欄位錯誤。

### 7. 臨時密碼重設並重新顯示
擴充既有 `resetMemberPassword(userId)`（`app/actions/admin.ts`），於詳情頁提供「重設臨時密碼」按鈕：重設後產生新臨時密碼、設 `isTempPassword=true`，並**將臨時密碼回傳供畫面重新顯示**（不僅寄送 Email）。僅 `canAccessAdmin` 可呼叫。
- **為何**：管理者常需當面或即時轉交密碼，純 Email 不足；重新顯示讓重設與新增會員的密碼揭露行為一致。

### 8. 禁止移除自身管理身分（防鎖死）
身分編輯 SHALL 阻止管理者移除「自己」的 `admin`／`superadmin` 身分，避免把自己鎖在後台外。Server Action 端與 UI 端皆需防呆，違反時回傳 `{ success: false, message: '無法移除自己的管理員身分' }`。

### 5. 開課前置：講師身分
`app/actions/course-session.ts`（及必要時 `course-invite.ts`）建立流程加入 `canTeach(session.user.roles)` 判定，未具資格回傳 `{ success: false, message: '需具講師身分方可開課' }`。管理者保留既有 prerequisite bypass。

### 6. 會員列表欄位
`admin-member-management` 列表移除「加入日期」欄位，新增「身分」欄位顯示所有身分（以 badge 呈現）。`lib/data/members.ts` 的 select 以 `roles` 取代 `role`；排序仍可沿用 `createdAt`（不顯示但作排序鍵）。

## Risks / Trade-offs

- [移除 `role` 欄位後，舊程式碼若仍引用 `user.role` 會在執行期出錯] → schema 與程式碼於同一提交一併部署（本專案慣例），migration 內先 backfill 再 drop。
- [既有已簽發的 JWT 帶舊 `role`] → 每請求 DB 同步會以 `roles` 重寫 token；舊 session 於下次請求自動升級，影響可忽略。
- [Postgres enum 陣列查詢需用 `has`／`hasSome`，與既有 `equals` 寫法不同] → 統一改走 helper 與 data layer，降低誤用。
- [臨時密碼以明文顯示給管理者] → 僅顯示一次、不落庫（僅存雜湊）；首次登入強制改密。
- [enum 陣列日後若要加身分仍須 migration] → 可接受，身分屬低頻變動。

## Migration Plan

1. `UserRole` enum 新增 `teacher`。
2. 新增欄位 `roles UserRole[] @default([user])`。
3. 資料 backfill（raw SQL）：`user → {user}`、`admin → {user,admin}`、`superadmin → {user,superadmin}`。
4. 於同一 migration drop 舊 `role` 欄位。
5. 同步部署 `lib/auth.ts`、`types/next-auth.d.ts`、helper 與所有守衛、`lib/data/members.ts`、會員匯出欄位。
6. **Rollback**：還原 migration（重建 `role` enum 欄位，依 `roles` 取最高權限回填）＋ 還原程式碼提交。

## Open Questions

（皆已確認，見上方 Decisions）

- ✅ 後台新增會員時**同時產生** `spiritId`（重用 `generateSpiritId()`）—— 見 Decision 4。
- ✅ 臨時密碼**提供「重設並重新顯示」**功能 —— 見 Decision 7。
- ✅ 管理者**不可移除自己的** `admin`／`superadmin` 身分 —— 見 Decision 8。

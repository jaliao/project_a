## Context

目前課程邀請系統使用 token（`crypto.randomBytes(6)`）產生 12 字元 hex 字串，儲存於 `CourseInvite.token` 欄位，並透過 `/invite/[token]` 公開路由讓學員加入課程。這個設計增加了一層不必要的間接跳轉，且需維護 public route 與 middleware 例外規則。

課程頁面 `/course/[id]` 已有完整的學員申請流程（`student-apply-section.tsx` + `applyToCourse()`），教師只需分享課程 ID 即可達成相同目的。

## Goals / Non-Goals

**Goals:**
- 移除 token-based 邀請連結機制（`/invite/[token]` 路由、`joinInvite()` action、`token` DB 欄位）
- 將「複製邀請連結」按鈕改為複製 `/course/{id}` URL
- 清理相關死程式碼，保持 schema 乾淨

**Non-Goals:**
- 不修改學員申請流程（`applyToCourse()`、`student-apply-section.tsx` 維持不變）
- 不修改課程建立、管理、審核流程
- 不新增任何功能

## Decisions

### 1. 直接刪除 token 欄位，不保留相容性

**決定**：從 DB schema 移除 `CourseInvite.token`，並新增 migration。

**理由**：欄位本身無業務語意，不需向後相容。透過 migration 乾淨移除，避免 schema 留有廢棄欄位。

**替代方案**：保留欄位但停止使用 → 增加混淆、違反「乾淨 schema」原則，捨棄。

### 2. 複製按鈕改用 courseId 取代 token

**決定**：`copy-invite-link-button.tsx` 與 `invite-copy-button.tsx` 的 prop 由 `token: string` 改為 `courseId: number`，複製 `${window.location.origin}/course/{courseId}`。

**理由**：課程 ID 已存在於頁面 context，無需額外查詢；URL 格式穩定且對用戶更直觀。

### 3. 移除 `joinInvite()` 但保留 `createInvite()` 其餘邏輯

**決定**：僅移除 `joinInvite()` 函式及 `createInvite()` 中的 `token` 產生邏輯，其餘 server actions 不動。

**理由**：`createInvite()`、`applyToCourse()`、`approveEnrollment()` 等仍為核心業務邏輯，範圍最小化降低風險。

### 4. 移除 `/invite/[token]` 整個目錄

**決定**：刪除 `app/invite/` 目錄及 middleware 中的 `/invite` public path 設定。

**理由**：路由已無用途，保留會造成 404 且讓 public routes 更複雜。

## Risks / Trade-offs

- **已分享的舊邀請連結失效** → 預期行為，為刻意設計。現有環境為開發階段，無需通知現有用戶。
- **migration 需要 `make schema-update`** → 標準流程，無特殊風險。

## Migration Plan

1. 修改 `prisma/schema/course-invite.prisma`：移除 `token` 欄位
2. 執行 `make schema-update name=remove_invite_token`
3. 移除 `app/invite/` 目錄
4. 更新 `app/middleware.ts`
5. 更新 server actions（`app/actions/course-invite.ts`）
6. 更新 data layer（`lib/data/course-sessions.ts` 型別）
7. 更新複製按鈕元件（2 個）及 `create-invite-form.tsx`
8. 驗證 `npm run build` 無型別錯誤

**Rollback**：git revert + migration rollback（`ALTER TABLE ADD COLUMN token`）

## Context

現有管理後台首頁（`/admin`）含有 StatsCard、RecentMembers、EnrolledStudentsList 等多個資料區塊，視覺雜亂，缺乏明確的功能導覽。

重設密碼功能已有 `registerWithEmail` 中的 `sendTempPasswordEmail` + `generateTempPassword` 模式，可直接複用。

## Goals / Non-Goals

**Goals:**
- `/admin` 首頁改為功能按鈕網格，一眼看到所有功能入口
- 新增 `/admin/members` 頁：列出所有會員，管理者可對任一會員重設密碼（寄送臨時密碼）
- 儀錶板按鈕顯示但 disabled（標示「待開發」）

**Non-Goals:**
- 不刪除 StatsCard、RecentMembers 等 components（僅從此頁移除）
- 不實作會員詳細資料編輯
- 不實作會員停用/刪除

## Decisions

**決策 1：首頁改為純靜態 Server Component**
- 移除所有 `prisma` 查詢，頁面無需資料，直接渲染按鈕網格
- 按鈕使用 shadcn Card 或 Link 樣式，icon + 標題 + 說明文字

**決策 2：會員管理頁直接查詢 User 表**
- Server Component，`prisma.user.findMany` 依 `createdAt desc`
- 重設密碼用 Server Action `resetMemberPassword(userId)`：
  1. 呼叫 `generateTempPassword()`
  2. bcrypt hash 後 `prisma.user.update`（`passwordHash`, `isTempPassword: true`）
  3. 呼叫 `sendTempPasswordEmail` fire-and-forget

**決策 3：重設密碼按鈕為 Client Component（需 confirm dialog）**
- 避免誤觸，點擊後 confirm 再送出

## Risks / Trade-offs

- [Risk] 管理者重設密碼會立即使舊密碼失效 → 符合預期行為，UI 說明「將寄送臨時密碼至該使用者信箱」
- [Risk] `sendTempPasswordEmail` 可能失敗（fire-and-forget）→ 與現有 email 流程相同，可接受

## Why

課程老師會透過「講師資格回饋」推薦已結業學員成為書籍講師，但目前這些推薦只在會員詳情「推薦歷程」唯讀顯示，管理者缺少集中檢視「最新推薦」、追蹤處理狀態（是否已成為講師／暫不接受）的工具。同時儀錶板功能卡為靜態副標題，管理者無法一眼得知「有無待處理推薦」或「教材有無待批價/確認款項/出貨」。

## What Changes

- 新增後台頁 `/admin/recommendations`「推薦講師」管理：
  - 列出老師推薦（`InviteEnrollment.teacherRecommended = true`），**依回饋時間由新到舊**，預設顯示**未處理**。
  - 每筆狀態：**已成為講師**（推導自該會員已具對應書籍講師身分 `TEACHER_ROLE_BY_CATALOG[catalogId]`）／**暫不接受**（管理者記錄）／**未處理**（已推薦、未成為講師、未暫不接受）。
  - 可點選**另開新視窗**檢視該會員詳情（於該處指派書籍講師身分）。
  - **暫不接受推薦**動作：記錄備註＋時間＋管理者。
- 儀錶板功能卡**動態副標題**：
  - 「推薦講師」卡顯示待處理推薦筆數（未處理 > 0 時提示）。
  - 「教材作業」卡顯示待處理工作筆數（訂單狀態為待批價／待確認收款／待寄送者）。
- `InviteEnrollment` 新增 `recommendDeferredAt` / `recommendDeferredById` / `recommendDeferralNote`（migration）。

## Capabilities

### New Capabilities

- `admin-instructor-recommendations`: 後台推薦講師管理——集中列出老師推薦、依時間排序、狀態（已成為講師／暫不接受／未處理）、另開視窗看會員、記錄「暫不接受」決策（備註/時間/管理者）。

### Modified Capabilities

- `admin-dashboard`: 功能卡副標題改為動態——「推薦講師」顯示待處理推薦數、「教材作業」顯示待批價/確認款項/出貨數。

## Impact

- `prisma/schema/course-invite.prisma`：`InviteEnrollment` 新增 `recommendDeferredAt DateTime?`、`recommendDeferredById String? @db.Uuid`、`recommendDeferralNote String?`（＋ producedBy 類似的關聯或純欄位）→ migration
- `app/[locale]/(admin)/admin/recommendations/`（清單頁）＋ `components/admin/*`（暫不接受操作元件）
- `lib/data/`（推薦清單查詢：teacherRecommended=true ＋ 推導身分狀態；待處理計數；教材待辦計數）
- `app/actions/`（暫不接受／取消暫不接受 server actions，`canAccessAdmin`）
- `app/[locale]/(admin)/admin/page.tsx`：`ADMIN_FEATURES` 副標題改為依計數動態產生（新增「推薦講師」卡入口）
- 既有 `TEACHER_ROLE_BY_CATALOG`、`lib/utils/material-order-status.ts`
- `doc/管理者操作手冊.md`、`config/version.json`、README-AI
- 純後台、繁體（非 i18n 範圍）

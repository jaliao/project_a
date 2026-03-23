## 1. 資料庫模型

- [x] 1.1 新增 `prisma/schema/course-invite.prisma`，定義 `CourseInvite`（含 `courseOrderId Int?` FK）與 `InviteEnrollment`（含 `@@unique([inviteId, userId])`）模型
- [x] 1.2 在 `prisma/schema/course-order.prisma` 的 `CourseOrder` 加入反向關聯 `courseInvites CourseInvite[]`
- [x] 1.3 執行 `make schema-update name=add_course_invite` 產生 migration 並更新 Prisma client

## 2. Middleware 與路由

- [x] 2.1 在 `app/middleware.ts` 的 `PUBLIC_PATHS` 加入 `/invite`，使 `/invite/[token]` 公開可存取
- [x] 2.2 新增 `app/invite/[token]/page.tsx`（Server Component）：驗證 token → 已登入則呼叫 joinInvite → redirect `/dashboard?enrolled=1`；未登入由 middleware 攔截

## 3. Zod Schema 與 Server Actions

- [x] 3.1 新增 `lib/schemas/course-invite.ts`，定義建立邀請 schema（title 必填、maxCount 正整數、courseOrderId 選填數字）
- [x] 3.2 新增 `app/actions/course-invite.ts`，實作 `createInvite`（產生 token、prisma.create）
- [x] 3.3 實作 `joinInvite(token)`（查詢 invite、upsert enrollment、回傳 inviteTitle）
- [x] 3.4 實作 `getMyInvites()`（查詢當前使用者建立的邀請，含 `_count.enrollments` 與 `courseOrder.buyerNameZh`）

## 4. 建立邀請 Dialog（教師端）

- [x] 4.1 新增 `components/course-invite/create-invite-dialog.tsx`，Dialog 殼 props: `open`、`onOpenChange`
- [x] 4.2 新增 `components/course-invite/create-invite-form.tsx`，含：title Input、maxCount Input、courseOrderId Select（顯示教師自己的 CourseOrder 清單，選填）
- [x] 4.3 建立成功後切換至「複製連結」View，顯示邀請連結 + 「複製連結」按鈕（點擊呼叫 `navigator.clipboard.writeText`，短暫顯示「已複製！」）

## 5. Dashboard 整合

- [x] 5.1 在 `app/(user)/dashboard/page.tsx` 新增「開課邀請」按鈕（Client Component 包裝，開啟 CreateInviteDialog）與「查看邀請進度」連結（導向 `/invites`）
- [x] 5.2 在 Dashboard Client 層加入 `?enrolled=1` 偵測：若存在則顯示 Sonner `toast.success('已成功加入課程！')`，並以 `router.replace('/dashboard')` 清除 query param

## 6. 邀請進度頁

- [x] 6.1 新增 `app/(user)/invites/page.tsx`（Server Component），查詢 `getMyInvites()`，顯示邀請列表（title、courseOrder 資訊、maxCount、已報名數、建立時間）
- [x] 6.2 每筆邀請顯示「複製連結」按鈕（Client Component，行為同 4.3）
- [x] 6.3 每筆邀請可展開學員列表（顯示 `InviteEnrollment` 的 user name、email、joinedAt）
- [x] 6.4 空狀態：無邀請記錄時顯示「尚未建立任何邀請」

## 7. 版本與文件

- [x] 7.1 更新 `config/version.json` patch 版本號 +1
- [x] 7.2 更新 `README-AI.md`（新增 CourseInvite/InviteEnrollment 模型，更新系統架構與任務狀態）

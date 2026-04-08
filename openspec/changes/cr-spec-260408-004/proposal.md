## Why

「靈人編號」與「Spirit ID」是同一個欄位的兩種舊稱，現統一改為「啟動編號」以符合系統語意。同時補強會員管理的搜尋（可用啟動編號查詢）與排序（加入日期、姓名）功能。

## What Changes

- 將所有 UI 顯示文字「靈人編號」與「Spirit ID」改為「啟動編號"
  - `app/onboarding/onboarding-wizard.tsx`：Step 3 歡迎畫面標籤
  - `app/(user)/admin/members/page.tsx`：會員管理表格欄位標題
  - `app/(user)/admin/members/[id]/page.tsx`：會員詳情欄位標籤
  - `app/(user)/user/[spiritId]/page.tsx`：個人資料頁標籤
  - `components/course-session/create-course-wizard/invite-step.tsx`：邀請輸入框 placeholder
- `lib/data/members.ts`：`searchMembers` 新增 `spiritId` 至搜尋條件（OR）
- `lib/data/members.ts`：`searchMembers` 排序改為 `[{ createdAt: 'desc' }, { realName: 'asc' }]`

**不變更：**
- DB 欄位名稱（`spiritId` 保留）
- 程式碼變數名稱（`spiritId` 保留）
- URL 路由（`/user/[spiritId]/...` 保留）

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `spirit-id`：UI 顯示名稱從「靈人編號」/「Spirit ID」改為「啟動編號"
- `admin-member-management`：搜尋新增啟動編號；排序加入加入日期 + 姓名

## Impact

- `lib/data/members.ts`：搜尋條件 + 排序邏輯
- `app/onboarding/onboarding-wizard.tsx`：純文字改名
- `app/(user)/admin/members/page.tsx`：純文字改名
- `app/(user)/admin/members/[id]/page.tsx`：純文字改名
- `app/(user)/user/[spiritId]/page.tsx`：純文字改名
- `components/course-session/create-course-wizard/invite-step.tsx`：純文字改名
- 不影響 DB schema、API、登入流程

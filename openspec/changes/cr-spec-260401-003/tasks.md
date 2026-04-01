## 1. Data Layer

- [x] 1.1 在 `lib/data/members.ts` 新增 `searchMembers(q?: string)` — 查詢所有 User，依 `realName`/`name`/`nickname`/`email` 進行 OR contains 篩選（大小寫不敏感），依 `createdAt desc` 排序
- [x] 1.2 在 `lib/data/members.ts` 新增 `getMemberDetail(id: string)` — 查詢單一 User，包含：學習紀錄（`InviteEnrollment` JOIN `CourseInvite` WHERE `startedAt IS NOT NULL`）、授課紀錄（`CourseInvite` WHERE `createdById = id` AND `startedAt IS NOT NULL`），各含 `courseCatalog.label`

## 2. 搜尋功能（清單頁）

- [x] 2.1 新增 `components/admin/member-search-input.tsx`：Client Component，受控輸入，debounce 300ms 後用 `useRouter` 更新 `?q=` URL param
- [x] 2.2 修改 `app/(user)/admin/members/page.tsx`：讀取 `searchParams.q`，傳入 `searchMembers(q)` 替換原本的全量查詢，並在表格上方渲染 `MemberSearchInput`

## 3. 會員詳情頁

- [x] 3.1 新增 `app/(user)/admin/members/[id]/page.tsx`：Server Component，呼叫 `getMemberDetail(id)`，找不到時重新導向 `/admin/members`；非管理者導向 `/`
- [x] 3.2 渲染基本資料卡：姓名、暱稱、Email、靈人編號、角色、加入日期
- [x] 3.3 渲染學習紀錄表格：課程名稱、課程目錄、開始授課日期；無資料時顯示「尚無學習紀錄」
- [x] 3.4 渲染授課紀錄表格：課程名稱、課程目錄、開始授課日期；無資料時顯示「尚無授課紀錄」
- [x] 3.5 在詳情頁加入「重設密碼」按鈕，複用現有 `MemberResetButton`
- [x] 3.6 在清單頁的每列加入「查看詳情」連結，導向 `/admin/members/[id]`

## 4. 刪除功能

- [x] 4.1 在 `app/actions/admin.ts` 新增 `deleteMember(userId)` Server Action：驗證 session（管理者）、依序刪除關聯資料（`InviteEnrollment`、`CourseInvite`）、最後刪除 `User`，成功後回傳 `{ success: true }`
- [x] 4.2 新增 `components/admin/member-delete-button.tsx`：Client Component，AlertDialog 二次確認，確認後呼叫 `deleteMember(userId)`，成功後 `router.push('/admin/members')`
- [x] 4.3 在詳情頁以 `process.env.ENABLE_MEMBER_DELETE === 'true'` 條件渲染 `MemberDeleteButton`

## 5. 環境變數與版本更新

- [x] 5.1 在 `.env.example` 新增 `ENABLE_MEMBER_DELETE=false` 說明
- [x] 5.2 將 `config/version.json` patch 版本號 +1
- [x] 5.3 更新 `README-AI.md` 版本號與功能描述

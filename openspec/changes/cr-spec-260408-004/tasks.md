## 1. UI 文字改名：靈人編號 / Spirit ID → 啟動編號

- [x] 1.1 `app/onboarding/onboarding-wizard.tsx:248`：「您的靈人編號」→「您的啟動編號」
- [x] 1.2 `app/(user)/admin/members/page.tsx:59`：表格欄位標題「靈人編號」→「啟動編號」
- [x] 1.3 `app/(user)/admin/members/[id]/page.tsx:104`：詳情欄位標籤「靈人編號」→「啟動編號」
- [x] 1.4 `app/(user)/user/[spiritId]/page.tsx:123`：個人資料頁「Spirit ID」標籤→「啟動編號」
- [x] 1.5 `components/course-session/create-course-wizard/invite-step.tsx:72`：placeholder「輸入 Spirit ID（例：PA260001）」→「輸入啟動編號（例：PA260001）」

## 2. 會員管理搜尋：加入 spiritId 條件

- [x] 2.1 `lib/data/members.ts`：`searchMembers` OR 條件新增 `{ spiritId: { contains: q, mode: 'insensitive' } }`

## 3. 會員管理排序：加入日期 + 姓名

- [x] 3.1 `lib/data/members.ts`：`orderBy` 改為 `[{ createdAt: 'desc' }, { realName: 'asc' }]`

## 4. 版本與驗證

- [x] 4.1 `config/version.json` patch +1
- [x] 4.2 確認 `npm run build` 通過

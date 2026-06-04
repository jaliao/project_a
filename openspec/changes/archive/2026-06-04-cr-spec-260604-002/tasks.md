## 1. Server Action

- [x] 1.1 在 `app/actions/` 新增 `createTestCourseSession` Server Action（標準 ActionResponse 回傳型別）
- [x] 1.2 加入守衛：`NODE_ENV === 'production'` 直接拒絕；`auth()` 驗證已登入，未登入回傳「請先登入」
- [x] 1.3 先以 `generateSpiritId()` 取得 5 個 spiritId，並組出唯一 email（`test-stu-{timestamp}-{i}@test.local`）與 realName/name
- [x] 1.4 於 `prisma.$transaction()` 內建立 5 位臨時 `User`、1 筆啟動靈人 `CourseInvite`（`courseCatalogId=1`、`maxCount=5`、`createdById`、`courseOrderId=null`、`startedAt/cancelledAt/completedAt` 皆 null），及 5 筆 `InviteEnrollment`（`status=approved`、`materialChoice=none`）
- [x] 1.5 成功後 `revalidatePath` 對應的授課清單頁，回傳成功訊息與 `inviteId`

## 2. UI 按鈕

- [x] 2.1 新增測試授課按鈕 client 元件（呼叫 1.1 的 action、處理 loading 與 toast）
- [x] 2.2 於 `app/(user)/user/[spiritId]/page.tsx` 以 `process.env.NODE_ENV === 'development'` 條件，將按鈕並排於既有「新增授課」旁
- [x] 2.3 確認 production 環境下按鈕與相關 UI 完全不渲染（程式碼層級：頁面條件 + action 內守衛）

## 3. 驗證

- [x] 3.1 開發環境：點擊按鈕成功建立 1 授課 + 5 學員 + 5 報名，且無 `CourseOrder`、授課為待開課狀態（需 dev DB 手動實測）
- [x] 3.2 連續點擊兩次，確認各自獨立、學員與 spiritId/email 不衝突（需 dev DB 手動實測）
- [x] 3.3 production 隱藏按鈕 + action 拒絕：由程式層雙重 guard 保證（頁面 `NODE_ENV === 'development'` 條件於 production build 被 tree-shake；action 首行 `NODE_ENV === 'production'` 即回傳，DB 操作前拒絕）
- [x] 3.4 `npm run build` 通過（含型別檢查與 Next 內建 lint）

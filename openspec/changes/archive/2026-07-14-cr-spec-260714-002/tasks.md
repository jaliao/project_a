# cr-spec-260714-002 Tasks

## 1. DB Schema

- [x] 1.1 新增 `prisma/schema/admin-log.prisma`：`AdminActionLog` model（`action` String、`actorId`/`targetUserId`/`inviteId` optional FK 皆 `onDelete: SetNull`、`actorName`/`targetName`/`inviteTitle` 快照欄、`detail`、`createdAt`；`User`/`CourseInvite` 補反向關聯），`make schema-update name=add_admin_action_log`
- [x] 1.2 `config/` 新增操作紀錄動作常數（config-driven：`enrollment_add`/`enrollment_remove` 與顯示標籤）

## 2. Data Layer 與 Server Actions

- [x] 2.1 `app/actions/admin.ts`：自 `createMember` 抽出可於 transaction 內重用的建帳號 helper（spiritId＋臨時密碼＋白名單，行為不變）
- [x] 2.2 `lib/data/`：新增班級學員清單查詢（班級資訊＋報名學員：姓名、顯示名稱、啟動編號、email、報名/結業狀態、教材寄送項目數）與 email 查既有會員（供 UI 確認列）
- [x] 2.3 新增 `addStudentToInvite` Server Action：權限＋Zod 驗證；email 查帳號→掛既有或建新（交易內，回傳一次性臨時密碼）；建 `status=approved` 報名（重複報名回欄位錯誤）；勾已結業時 `graduatedAt=joinedAt=結業日`、班級 `completedAt` 為空則同交易補同日；同交易寫入 `enrollment_add` 紀錄（含快照與摘要）；不寄信不通知；`revalidatePath`
- [x] 2.4 新增 `removeStudentFromInvite` Server Action：權限；`shipmentItems > 0` 拒絕並提示先處理教材；交易內刪除報名＋寫入 `enrollment_remove` 紀錄（摘要含是否已結業）；`revalidatePath`
- [x] 2.5 `lib/data/`：操作紀錄查詢（最新在前、每頁 30 筆、支援 `inviteId` 過濾）

## 3. UI — 開課管理卡片選單

- [x] 3.1 `/admin/course-sessions` 每筆課程顯示班級編號（`#id`，桌機與手機版面皆呈現）
- [x] 3.2 卡片右上角「⋯」`DropdownMenu`，選單項依序：新增學員、移除學員、變更課程狀態、查詢 LOG；連往獨立頁面者 `target="_blank"` 另開視窗（students 頁與 `?inviteId=` 過濾的 operation-logs 頁）
- [x] 3.3 「變更課程狀態」改為選單觸發之原地 dialog（沿用既有狀態規則與 action：招生中/進行中/已取消、不可選已結業、已結業停用顯示），移除原 inline 狀態下拉

## 4. UI — 班級學員管理頁

- [x] 4.1 新增 `app/[locale]/(admin)/admin/course-sessions/[id]/students/page.tsx`：頁首（班級編號＋課程名稱＋講師＋狀態）＋學員卡片清單（姓名、顯示名稱、啟動編號、email、報名/結業狀態），手機單欄無橫向捲動；不自行重複權限判定
- [x] 4.2 新增學員表單（client 元件）：姓名＋email 必填、「已結業」勾選＋結業日；email 輸入後顯示既有會員確認列（姓名＋啟動編號）或「將建立新帳號」；勾已結業且班未結業時提示「班級未結業將一併標記結業」；成功建新帳號時一次性顯示臨時密碼；`?action=add` 自動開啟表單
- [x] 4.3 移除學員按鈕：已結業報名顯示醒目影響警示確認對話框（證書待製作／師生階層／擋修）；教材關聯遭 server 拒絕時 toast 呈現提示

## 5. UI — 操作紀錄頁

- [x] 5.1 新增 `app/[locale]/(admin)/admin/operation-logs/page.tsx`：最新在前、每頁 30 筆分頁（比照證書頁樣式），欄列：時間、操作者、動作、班級、對象、摘要（以快照欄呈現，不依賴 join）；支援 `?inviteId=` 過濾
- [x] 5.2 後台 dashboard 功能格加入「操作紀錄」入口

## 6. 驗證

- [x] 6.1 `npm run lint` 與 `npm run build` 通過
- [x] 6.2 手動驗證——新增：既有 email 掛帳號（顯示確認列、不建帳號）；新 email 建帳號＋臨時密碼一次性顯示（不寄信）＋該員可用臨時密碼登入並被導向改密；重複報名擋下；補登結業（未結業班補 `completedAt`、已結業班不動；證書待製作出現該員）
- [x] 6.3 手動驗證——移除：一般報名可移除；已結業報名出現警示確認；有教材寄送項目者遭拒；移除後證書待製作卡片消失
- [x] 6.4 手動驗證——選單與 LOG：卡片「⋯」四選單項行為（另開視窗／原地 dialog）；狀態變更規則不變；操作紀錄頁列出新增/移除各一筆且 `?inviteId=` 過濾正確；刪除對象會員後紀錄仍以快照完整顯示
- [x] 6.5 手動驗證——實際案例演練：同名拆帳（建新帳號＋補登結業＋移除錯誤報名）與重複帳號搬課（新增到新帳號帶結業＋移除舊帳號報名＋會員暫停舊帳號）流程可完成

## 7. 文件與版本

- [x] 7.1 更新 `doc/管理者操作手冊.md`：開課管理章節（班級編號、⋯選單、狀態變更 dialog）＋新增「班級學員管理」與「操作紀錄」章節，並更新檔首版本標註與日期
- [x] 7.2 更新 `doc/老師手冊.md`：補充「換班／名冊遺漏請回報管理員處理」說明，並更新檔首版本標註與日期
- [x] 7.3 `config/version.json` patch +1 並更新 `updatedAt`（依規範於 /opsx:apply 時執行）
- [x] 7.4 依 `.ai-rules.md` 重新產生 `README-AI.md`（依規範於 /opsx:apply 時執行）

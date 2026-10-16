## 1. 資料層

- [x] 1.1 新檔 `lib/data/duplicate-accounts.ts`：匯出 `findDuplicateCandidates()`
  - 查詢所有 `realName` 非空的會員，取 `id`、`spiritId`、`email`、`realName`、`englishName`、`nickname`、`displayNameMode`、`phone`、`commEmail`、`churchId`、`birthYear`、`gender`、`lastLoginAt`、`createdAt`
  - 依 `realName` 分組（`Map<string, User[]>`），僅保留 size ≥ 2 的分組
  - 組內兩兩配對，依序判斷信心等級（最高 → 高 → 中，取最先命中者，不重複判斷其餘規則）：
    - 最高：`isUndeliverableEmail(a.email) || isUndeliverableEmail(b.email)`（`lib/mailer.ts`）
    - 高：`a.phone === b.phone && a.phone`，或 `a.commEmail === b.commEmail && a.commEmail`
    - 中：`a.churchId === b.churchId && a.churchId !== null`，或 `a.birthYear === b.birthYear && a.gender === b.gender && a.birthYear !== null`
  - 對命中的配對，額外查詢兩邊的 `InviteEnrollment` 筆數與 `graduatedAt !== null` 筆數（報名/結業紀錄），組成回傳結構
  - 顯示名稱沿用 `getMemberDisplayName`（`lib/utils/member-display.ts`）
  - 結果依信心等級排序（最高 → 高 → 中）回傳

## 2. 頁面

- [x] 2.1 新檔 `app/[locale]/(admin)/admin/members/duplicates/page.tsx`（server component，比照 `app/[locale]/(admin)/admin/members/inactive/page.tsx` 結構）
  - 守衛（登入 + admin 身分）由 `(admin)/layout.tsx` 統一處理，頁面內不重複判斷
  - `await findDuplicateCandidates()`，無候選時顯示「目前無疑似重複帳號」
  - 每組候選以卡片或並排雙欄表格呈現兩邊：啟動編號、顯示名稱、Email（`MaskedValue`）、電話（`MaskedValue`）、建立時間、是否未啟用（`lastLoginAt` 為 null 時顯示「未啟用」badge）、報名/結業筆數、「查看詳情」連結（`/admin/members/${id}`）
  - 清單依信心等級分段或以 Badge 標示（最高／高／中），比照既有 Badge variant 用法
  - `export const dynamic = 'force-dynamic'`，`export const metadata`（title: `疑似重複帳號 — 啟動事工`）

## 3. 後台首頁入口

- [x] 3.1 `app/[locale]/(admin)/admin/page.tsx`：功能卡片陣列新增一筆（title「疑似重複帳號」、description「比對可能重複建立的帳號」、icon 選用 `@tabler/icons-react` 既有圖示如 `IconUsersGroup`、`href: '/admin/members/duplicates'`、`superadminOnly: false`）

## 4. 操作手冊

- [x] 4.1 `doc/管理者操作手冊.md`：新增「疑似重複帳號」頁面說明（三個信心等級的意義、純查看不可操作、如何搭配「查看詳情」核對）
- [x] 4.2 `config/version.json` patch +1，`updatedAt` 更新為當日日期

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 與 `npm run build` 皆成功
- [x] 5.2 情境：兩筆會員同名，其中一筆 email 為 `{spiritId}@seed.iwillshare.org.tw` → 出現在清單，標示「最高」
- [x] 5.3 情境：兩筆會員同名、皆非合成信箱，但 `phone` 相同 → 標示「高」
- [x] 5.4 情境：兩筆會員同名，僅同教會或同出生年+性別 → 標示「中」
- [x] 5.5 情境：兩筆會員同名但無任何輔助訊號命中 → 不出現在清單
- [x] 5.6 情境：`realName` 為空的會員 → 不與任何人配對出現
- [x] 5.7 情境：同一配對同時命中多等級 → 僅以最高等級出現一次
- [x] 5.8 情境：非管理者存取 `/admin/members/duplicates` → 依既有 `(admin)/layout.tsx` 守衛導向無權限/登入頁，與其他後台頁面行為一致
- [x] 5.9 人工抽樣：以正式環境或近似規模的測試資料跑出候選清單，抽樣確認分級結果合理、無明顯誤判氾濫

  實測結果（本機 dev DB，1710 筆會員、1690 筆有填姓名）：
  - 以 SQL 與正式 `findDuplicateCandidates()` 函式各自獨立跑一次，結果完全一致：總計 68 組（最高 51／高 14／中 3），另有 8 組「同名無輔助訊號命中」正確被排除於清單外。
  - 抽樣確認「最高」等級樣本（如 彭偉松 `pa260256@seed.iwillshare.org.tw` ↔ `leo924077@gmail.com`）、「高」等級樣本（如 陳佩如，電話皆為 `0988668291`，兩個完全不同的 email）皆為合理的真實重複帳號候選；「中」等級樣本（如 林楨維，同教會但一方性別未填）符合「較不篤定」的預期。
  - 以瀏覽器流程驗證（NextAuth credentials 登入 + `curl` 取頁面）：管理者登入後頁面正確顯示「共 68 組」、Email 遮蔽 `***` 共 136 處（68 組 × 2 側）且無任何合併/刪除/編輯按鈕；未登入與一般會員登入皆被導向登入頁／首頁，無法存取本頁。

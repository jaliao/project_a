## Why

名冊 seed 匯入的舊帳號（合成信箱 `{spiritId}@seed.iwillshare.org.tw`，`isUndeliverableEmail` 可判定）與使用者後來自行用真實 email 註冊的帳號，常是同一人卻拆成兩筆 `User`。目前後台「未啟用會員」清單（`admin-inactive-members`）只能看單一帳號清單，無法主動比對、抓出「哪兩筆可能是同一個人」，每次都要管理者憑印象肉眼比對，容易漏掉。

本 CR 先做**唯讀偵測**：盤點出疑似重複的帳號配對並分級呈現，不做任何寫入或合併動作（合併動作另立 CR-FEAT-261016-003，待本功能驗證候選品質後再做）。

## What Changes

- 後台新增一個獨立頁面 `/admin/members/duplicates`（「疑似重複帳號」），列出候選配對，依信心分級排序：
  - **最高**：`realName` 完全相同，且其中一方 email 為合成 seed 信箱（`isUndeliverableEmail`）。
  - **高**：`realName` 完全相同，且 `phone` 相同或 `commEmail` 相同。
  - **中**：`realName` 完全相同，且同 `churchId` 或 `birthYear`+`gender` 相同。
  - 僅比對 `realName` 非空的會員；`realName` 為空者不納入比對（空字串比對無意義，容易全部互相命中造成噪音）。
- 每組候選並排顯示兩邊關鍵欄位：啟動編號（spiritId）、顯示名稱、Email（遮蔽，比照既有機敏欄位規則）、電話（遮蔽）、建立時間、是否未啟用（`lastLoginAt`）、是否有報名/結業紀錄（粗略筆數），並各提供「查看詳情」連結到既有會員詳情頁，方便管理者進一步核對。
- 純查詢呈現，**不提供**合併、刪除、編輯等任何寫入操作。
- 從後台首頁（`/admin`）功能卡片新增一個入口，比照「未啟用會員」卡片的呈現方式。

## Capabilities

### Added Capabilities

- `admin-duplicate-account-detection`：後台疑似重複帳號偵測清單，依信心分級列出候選配對，純唯讀呈現。

## Impact

- 新頁面：`app/[locale]/(admin)/admin/members/duplicates/page.tsx`（server component，沿用 `MaskedValue`、`MemberHomeLink`、`Badge` 等既有 admin 元件）。
- 資料層：新檔 `lib/data/duplicate-accounts.ts`，匯出 `findDuplicateCandidates()`：依 `realName` 分組，組內兩兩配對後依規則分級；重用 `getMemberDisplayName`（`lib/utils/member-display.ts`）與 `isUndeliverableEmail`（`lib/mailer.ts`）。
- 後台首頁：`app/[locale]/(admin)/admin/page.tsx` 功能卡片陣列新增一筆。
- 不新增資料庫欄位、不新增 Server Action、不影響既有會員清單/詳情頁查詢。
- 操作手冊：`doc/管理者操作手冊.md` 新增本頁面的查看說明。

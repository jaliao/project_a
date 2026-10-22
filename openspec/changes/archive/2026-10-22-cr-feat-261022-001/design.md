## Context

老師／管理者在現場常常已經知道一位學員的真實姓名、性別、所屬教會，但該學員尚未完成系統註冊（沒有 email、沒有密碼）。目前「新增學員」（CR-SPEC-260916-004 之 `StudentPicker`）只能選既有會員，逼得老師得等學員自己註冊完才能把報名補上，現場登記與系統報名因此脫節。

系統已有兩塊可直接重用的既有機制：
- `User.email`／`phone` 本就允許 `null`（LINE-only 會員即是一例），`realName`／`gender`／`churchType`／`churchId`／`churchOther` 皆為既有欄位。
- `app/actions/member-merge.ts`：完整的「副帳號資料搬到主帳號、標記合併但不刪除、自此無法登入」機制，且已有 `isUndeliverableEmail`（合成 seed 信箱）作為「預設副帳號」訊號的慣例。

## Goals / Non-Goals

**Goals:**
- 老師／管理者能在新增學員時，為尚未註冊的學員登記真實姓名、性別、所屬教會並直接加入班級。
- 代填學員結構上即無法登入、無法被聯絡（不需額外 guard 邏輯）。
- 代填學員日後可透過既有「合併帳號」機制與該學員自行註冊的真實帳號連結，且預設方向判斷能辨識出「哪一筆該當副帳號」。
- 業務統計（課程人數、結業人數、教會分布）維持把代填學員計入；僅「會員總數」類排除代填學員。

**Non-Goals:**
- 不另開新表（如 `OfflineStudent`）承載代填學員，一律重用 `User`。
- 不另寫一套合併／資料搬動邏輯，合併仍走既有 `mergeMembers()`。
- 不支援批量匯入代填學員（如 Excel 批次建立），本次僅支援課程頁單筆建立。
- 不開放代填學員本人以任何方式登入或自行「升級」為正式帳號——身分轉換**只能**由管理者／老師透過合併精靈執行，不做自動比對或自動合併。
- 不新增會員列表的「未註冊」篩選下拉；本次僅提供徽章顯示與既有「疑似重複帳號清單」作為尋找入口。

## Decisions

### 1. 重用 `User`，不另開新表

`InviteEnrollment`、`CertificateProduction`、`checkPrerequisites`、`LearningStudyEntry`、`Friendship` 等一大批既有邏輯皆假設 `userId` 指向一筆 `User`。若另開一張代填學員專用表，等於要把這些邏輯重做一份轉換層，且日後「連結真實帳號」還要自己實作一次資料搬動，等同重造 `mergeMembers()` 的輪子。重用 `User` 讓代填學員「天生」就適用所有既有查詢與統計，合併時零額外邏輯。

### 2. 用明確旗標 `isProxyMember`，不依賴 `email IS NULL` 推斷

`email IS NULL` 已有其他合法語意（LINE-only 會員尚未提供 email），不能拿來當「是否為代填學員」的判斷依據，否則會誤判既有 LINE 會員。新增獨立布林旗標，語意單一、不與其他欄位語意耦合。

### 3. 不新增登入阻擋 guard

代填學員建立時 `email = null`、`passwordHash = null`、不建立任何 `Account` 記錄。NextAuth 的 Credentials 與 Google OAuth 登入皆要求對應的密碼或 `Account` 記錄存在，結構上就無法通過，行為等同既有「尚未完成註冊」狀態，不需要比照 `mergedIntoId`／`suspendedAt` 另寫 middleware／`signIn` callback 攔截。

### 4. 合併方向預設邏輯：`isProxyMember` 與 `isUndeliverableEmail` 同等視為「建議為副帳號」訊號

`suggestSecondary()` 現行規則：恰好一方符合 `isUndeliverableEmail` 時，建議該方為副帳號。延伸為：恰好一方符合 `isUndeliverableEmail` **或** `isProxyMember` 時，建議該方為副帳號；兩個訊號同時命中兩個不同帳號、或兩帳號皆未命中任一訊號時，維持現行「不給預設值，管理者必須手動指定」的保守行為，避免誤判方向。

### 5. 統計口徑只動「會員總數」類，不動業務統計

代填學員雖然「尚未註冊」，但他確實參加了課程、確實可能結業——課程人數、結業人數、教會分布等統計反映的是業務事實，不應該因為他還沒註冊就被排除。只有語意明確是「系統已註冊會員數」的兩處統計（首頁、後台儀錶板的「會員總數」／「學員總數」）才排除，避免虛增已註冊會員的印象。

### 6. 新增學員的「代填」路徑沿用既有先修驗證、人數上限、教材預設規則，不給豁免

代填學員一律是全新建立的 `User`，沒有任何歷史報名記錄，`checkPrerequisites()` 對其查詢自然會回傳「未完成先修」（若該班課程有先修條件）。這與「老師／管理者對不符先修資格的既有會員也一律擋下」的現行規則一致，不需要、也不應該為代填流程另開豁免。人數上限與教材預設（新生 → 繁體教材）邏輯亦直接沿用現行 `addStudentToInvite` 判斷。

### 7. 操作紀錄沿用既有 `enrollment_add` 代碼，不新增 action

`AdminActionLog.action` 的值域（`config/admin-log-action.ts`）目前以「操作類型」分類（新增學員／移除學員／...），代填建立仍屬於「新增學員」這個操作類型，僅操作細節不同。沿用 `enrollment_add`，`detail` 文字註明「建立代填學員（未註冊）」以區分既有「掛既有帳號」的文案，避免在 action 值域與 `admin-activity-log` 規格再多開一個分支。

## Risks / Trade-offs

- 代填學員 `email = null`、`passwordHash = null` 與既有「LINE-only 會員」結構相同；若未來任何依賴 email 做比對或寄信的分支沒有正確處理 null，風險與既有 LINE-only 會員路徑共通，非本次新增風險，但實作時仍需沿用既有 `resolveContactEmail`／白名單查詢對 null 的既有防呆。
- 代填學員若已有報名、教材寄送等關聯資料，仍適用既有「條件式會員刪除」的 FK 檢查，不特別放寬或限制。
- 代填學員在「會員總數」類統計被排除後，若管理者誤解為「系統沒有記錄這個人」，可能造成誤會；徽章顯示與操作手冊更新用於降低此風險。
- 合併方向預設邏輯的訊號擴充後，若某帳號**同時**符合 `isUndeliverableEmail` 與 `isProxyMember`（理論上不會發生，代填學員不會有合成 seed 信箱），`suggestSecondary()` 的判斷仍以「恰好一方命中」為準，不受影響。

## Migration Plan

1. Schema：`User` 新增 `isProxyMember Boolean @default(false)`，透過 `make schema-update` 建立 migration；既有會員預設 `false`，不影響既有資料。
2. 後端：`invite-students.ts` 新增「建立代填學員」Server Action（交易內建立 `User` + `InviteEnrollment` + `AdminActionLog`）；`member-merge.ts` 的 `suggestSecondary()` 擴充判斷；`student-picker.ts` 查詢回傳欄位新增 `isProxyMember`；重複帳號偵測查詢的最高信心條件擴充。
3. 前端：新增學員 Dialog 增加「建立代填學員」分支表單；`StudentPicker` 候選人卡片、會員列表/詳情頁、疑似重複帳號清單並排卡片新增「未註冊」徽章。
4. 統計：後台儀錶板「學員總數」查詢加上 `isProxyMember: false` 篩選（`lib/data/dashboard.ts`）。原規劃另含首頁 `dashboard-home` 之「會員總數」卡片，實作時發現該頁已無統計卡片內容（純轉址），此項作廢，詳見 `proposal.md` 說明。
5. 回退：純新增欄位與新路徑，不修改既有欄位語意或既有查詢的既有篩選條件（除上述兩處統計口徑），風險可控；回退僅需還原程式碼變更，資料庫欄位可保留（`default(false)` 不影響既有資料）。

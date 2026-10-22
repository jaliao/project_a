## Why

目前「課程 → 新增學員」（`app/actions/invite-students.ts`，CR-SPEC-260916-004 之 `StudentPicker` 架構）僅能選既有會員的 `userId` 加入班級，完全無法處理一種常見現場情境：老師／管理者當下已知道一位學員的真實姓名、性別、所屬教會，但該學員尚未（或還不會）自行完成系統註冊。目前只能等學員自己註冊後才能被加入班級，造成現場登記與系統報名脫節。

系統已有兩塊可直接重用的基礎，足以在不新增表、不新增合併邏輯的前提下支撐這個情境：
1. `User` 的 `email`／`phone` 本就允許 `null`（既有註解：僅以 LINE 登入、LINE 未提供 email 的會員即是一例），`realName`／`gender`／`churchType`／`churchId`／`churchOther` 亦皆為既有欄位。
2. `app/actions/member-merge.ts` 已是一套完整的「副帳號資料搬到主帳號、副帳號標記合併但保留殘影、自此無法登入」機制，且既有合成 seed 信箱（`isUndeliverableEmail`）已有「預設副帳號」的判斷慣例可直接延伸。

## What Changes

- `User` 新增 `isProxyMember Boolean @default(false)` 欄位，標記「代填（未註冊）學員」。這類帳號 `email`／`passwordHash` 皆為 `null`、不建立任何 `Account`，結構上即無法登入、無法被聯絡，不需另寫登入阻擋 guard。
- 課程頁「新增學員」流程新增第二條路徑「建立代填學員」：僅填真實姓名（必填）、性別、所屬教會，其餘（結業補登、教材選擇、人數上限、先修驗證）沿用既有 `addStudentToInvite` 規則，一律視為新生、不豁免任何既有限制。建立與報名於同一交易完成，寫入既有 `enrollment_add` 操作紀錄（`detail` 註明為代填建立，不新增 action 代碼）。
- `StudentPicker` 候選人與既有會員列表／詳情頁，`isProxyMember = true` 者 SHALL 顯示「未註冊」徽章，避免與正常會員混淆；不影響其可被搜尋到（合併時仍需要被找到）。
- 帳號合併（`member-merge.ts`）的主/副帳號預設方向判斷，延伸納入 `isProxyMember`：與既有 `isUndeliverableEmail` 同等視為「建議為副帳號」訊號，兩訊號同時命中或皆未命中時維持手動指定（行為與現行「兩邊皆非合成信箱」規則一致）。
- 「疑似重複帳號清單」（`admin-duplicate-account-detection`）之「最高信心」等級定義延伸納入 `isProxyMember`，協助管理者主動發現「代填學員很可能已經註冊出一個新帳號」的配對並導向合併。
- 後台儀錶板（`admin-dashboard`）之「學員總數」統計口徑排除 `isProxyMember = true` 的帳號，避免虛增已註冊會員數；課程人數、結業人數、教會分布等**業務**統計維持計入代填學員（因其確實代表一次真實的課程參與事實），不在此次調整範圍。（原規劃另有首頁 `dashboard-home` 之「會員總數」卡片，實作時發現該頁現已改為純轉址、無統計卡片內容，此項作廢，詳見 Capabilities 一節說明）

## Capabilities

### Added Capabilities
- `proxy-member-enrollment`：代填（未註冊）學員——`User.isProxyMember` 欄位語意、建立限制（結構上無法登入／聯絡）、資料範圍限制。

### Modified Capabilities
- `admin-enrollment-management`：「新增學員」流程新增「建立代填學員」路徑，沿用既有先修驗證、人數上限、教材預設規則。
- `admin-member-management`：合併帳號主/副帳號預設方向判斷納入 `isProxyMember`；會員列表／詳情頁新增「未註冊」徽章顯示。
- `admin-duplicate-account-detection`：「最高信心」等級定義與候選配對顯示欄位納入 `isProxyMember`。
- `student-picker`：候選人結果新增「未註冊」徽章顯示。
- `admin-dashboard`：後台儀錶板「學員總數」排除代填學員。

### 作廢項目
- `dashboard-home`：原規劃為首頁「會員總數」卡片排除代填學員，實作時確認 `/dashboard` 現已改為純轉址（導向 `/user/[spiritId]` 或 `/profile`），無任何統計卡片內容，全站僅 `/admin/dashboard`（已於上方 `admin-dashboard` 處理）有真正的「會員總數」統計。本項作廢，不修改 `dashboard-home` 規格與程式碼。

## Impact

- **新增**：`prisma/schema/user.prisma`（`isProxyMember` 欄位 + migration）、課程頁新增學員 Dialog 的「建立代填學員」子流程與對應 Server Action（`app/actions/invite-students.ts` 擴充）。
- **修改**：`app/actions/member-merge.ts`（`suggestSecondary` 納入 `isProxyMember`）、`lib/data/student-picker.ts`／`components/shared/student-picker.tsx`（回傳與顯示 `isProxyMember` 徽章）、`/admin/members` 列表與詳情頁（徽章）、`/admin/members/duplicates`（最高信心判定與顯示欄位）、後台儀錶板的會員總數查詢（`lib/data/dashboard.ts`）。
- **不修改**：NextAuth／middleware 登入判斷邏輯——代填學員因結構上無 `email`／`passwordHash`／`Account`，既有登入流程自然無法通過，不需比照 `mergedIntoId`／`suspendedAt` 另寫攔截。
- **操作手冊**：功能異動影響管理者與老師的「新增學員」操作，需同步檢查並修正 `doc/管理者操作手冊.md`、`doc/老師手冊.md`；`doc/學員手冊.md` 預期不受影響（代填學員本身尚無法登入使用系統），仍需檢查確認。依慣例於 apply 階段將 `config/version.json` patch 版本號 +1。

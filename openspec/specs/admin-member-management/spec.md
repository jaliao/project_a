## ADDED Requirements

### Requirement: 會員清單搜尋
管理者 SHALL 能在 `/admin/members` 頁面透過搜尋列篩選會員，搜尋條件涵蓋 `realName`、`name`、`nickname`、`email`、`spiritId` 欄位（OR 邏輯、不分大小寫、部分匹配）。搜尋條件 SHALL 透過 URL query string `?q=` 傳遞，以支援書籤與重新整理保留。表格欄位順序 SHALL 為：啟動編號、姓名、Email、身分、操作（不再顯示「加入日期」欄位）。「身分」欄 SHALL 顯示該會員擁有的所有身分。

#### Scenario: 依姓名搜尋
- **WHEN** 管理者在搜尋列輸入名字後停頓（debounce）
- **THEN** 頁面更新 URL `?q=<輸入值>` 並僅顯示符合的會員

#### Scenario: 搜尋無結果
- **WHEN** 搜尋條件無任何符合的會員
- **THEN** 頁面顯示「查無符合的會員」提示文字，清單為空

#### Scenario: 清除搜尋
- **WHEN** 管理者清空搜尋列
- **THEN** 頁面顯示全部會員清單

#### Scenario: 依啟動編號搜尋
- **WHEN** 管理者在搜尋框輸入完整或部分啟動編號（如「PA26」）
- **THEN** 系統回傳 `spiritId` 包含該字串的所有會員（不分大小寫）

#### Scenario: 啟動編號與姓名同時匹配
- **WHEN** 管理者輸入可能匹配姓名或啟動編號的字串
- **THEN** 系統回傳 `realName`、`email`、`spiritId` 任一匹配的會員

#### Scenario: 表格欄位順序
- **WHEN** 管理者進入 `/admin/members`
- **THEN** 表格第一欄為「啟動編號」（`spiritId`），依序為姓名、Email、身分、操作；不顯示「加入日期」欄位

#### Scenario: 身分欄顯示所有身分
- **WHEN** 某會員同時具備講師與管理者身分
- **THEN** 該列「身分」欄同時顯示「講師」與「管理者」（以 badge 呈現）

---

### Requirement: 會員詳情頁
系統 SHALL 提供 `/admin/members/[id]` 頁面，顯示個別會員的基本資料、學習紀錄與授課紀錄。非管理者存取 SHALL 被重新導向至 `/`。

#### Scenario: 顯示基本資料
- **WHEN** 管理者進入 `/admin/members/[id]`
- **THEN** 頁面顯示：姓名（`realName`）、暱稱（`nickname`）、Email、靈人編號（`spiritId`）、身分（所有 `roles`）、加入日期（`createdAt`）

#### Scenario: 顯示學習紀錄
- **WHEN** 管理者進入 `/admin/members/[id]`
- **THEN** 頁面顯示該會員作為學員的課程清單，僅包含 `CourseInvite.startedAt IS NOT NULL` 的場次，欄位包含：課程名稱（`CourseInvite.title`）、課程目錄（`courseCatalog.label`）、開始授課日期（`startedAt`）

#### Scenario: 學習紀錄為空
- **WHEN** 該會員尚未參加任何已開始的課程
- **THEN** 學習紀錄區塊顯示「尚無學習紀錄」

#### Scenario: 顯示授課紀錄
- **WHEN** 管理者進入 `/admin/members/[id]`
- **THEN** 頁面顯示該會員作為建立者（`CourseInvite.createdById = userId`）的課程清單，僅包含 `startedAt IS NOT NULL` 的場次，欄位包含：課程名稱、課程目錄、開始授課日期

#### Scenario: 授課紀錄為空
- **WHEN** 該會員尚未建立任何已開始的課程
- **THEN** 授課紀錄區塊顯示「尚無授課紀錄」

#### Scenario: 找不到會員
- **WHEN** URL 中的 id 不存在
- **THEN** 頁面顯示 404 或重新導向至 `/admin/members`

---

### Requirement: 條件式會員刪除
系統 SHALL 僅在環境變數 `ENABLE_MEMBER_DELETE=true` 時於詳情頁顯示刪除按鈕。刪除前 SHALL 顯示 AlertDialog 二次確認，確認後執行 hard delete。

#### Scenario: 刪除按鈕依環境變數顯示
- **WHEN** `ENABLE_MEMBER_DELETE` 未設定或不為 `'true'`
- **THEN** 詳情頁不渲染任何刪除相關 UI

#### Scenario: 刪除確認流程
- **WHEN** 管理者點擊刪除按鈕並在 AlertDialog 確認
- **THEN** 系統呼叫 `deleteMember(userId)` Server Action，刪除成功後重新導向至 `/admin/members`

#### Scenario: 取消刪除
- **WHEN** 管理者在 AlertDialog 點擊取消
- **THEN** 關閉 dialog，不執行任何刪除動作

---

### Requirement: 會員管理列表排序
會員管理列表 SHALL 依加入日期（新→舊）為主要排序，姓名（A→Z）為次要排序。

#### Scenario: 新加入會員排在前面
- **WHEN** 管理員開啟會員管理頁，無搜尋條件
- **THEN** 清單依 `createdAt` 降序排列，最新加入的會員排第一

#### Scenario: 同日加入者依姓名排序
- **WHEN** 多位會員在同一日加入
- **THEN** 同日會員依 `realName` 升序排列

---

### Requirement: 會員管理欄位標題使用「啟動編號」
會員管理表格及詳情頁 SHALL 以「啟動編號」顯示 spiritId 欄位。

#### Scenario: 會員列表欄位標題
- **WHEN** 管理員開啟會員管理列表
- **THEN** 第三欄標題顯示「啟動編號」

#### Scenario: 會員詳情欄位標籤
- **WHEN** 管理員開啟個別會員詳情頁
- **THEN** spiritId 欄位標籤顯示「啟動編號」

---

### Requirement: 後台新增會員
系統 SHALL 在 `/admin/members` 提供「新增會員」入口，僅 `canAccessAdmin` 的使用者可使用。表單 SHALL 可填寫姓名、Email 與身分（可複選）。送出後系統 SHALL：以既有機制核發 `spiritId`、產生隨機臨時密碼並雜湊儲存、建立 `User`（含選定身分、`isTempPassword=true`）、將 Email 寫入白名單（`isActive=true`）。系統 SHALL 於建立成功後將產生的臨時密碼回傳並顯示一次供管理者轉交。

#### Scenario: 成功新增會員
- **WHEN** 管理者填妥姓名、Email 與身分並送出
- **THEN** 系統建立可登入的會員（含 `spiritId` 與臨時密碼）、加入白名單，並顯示臨時密碼供轉交

#### Scenario: Email 已存在
- **WHEN** 送出的 Email 已被現有會員使用
- **THEN** 回傳欄位錯誤（如 `{ errors: { email: ['此 Email 已被使用'] } }`），不建立會員

#### Scenario: 新會員首次登入須改密
- **WHEN** 新建會員以臨時密碼登入
- **THEN** 因 `isTempPassword=true` 被導向變更密碼流程

#### Scenario: 非管理者無法新增會員
- **WHEN** 非 `canAccessAdmin` 的使用者呼叫新增會員 Server Action
- **THEN** 回傳 `{ success: false, message: '無權限' }`

---

### Requirement: 會員身分編輯
詳情頁 SHALL 讓 `canAccessAdmin` 的使用者編輯會員的身分集合（加掛或移除 `teacher`／`admin`／`superadmin`），`user` 基線恆保留。系統 SHALL NOT 允許管理者移除「自己」的 `admin` 或 `superadmin` 身分（防止把自己鎖在後台外），UI 與 Server Action 皆需防呆。

#### Scenario: 加掛講師身分
- **WHEN** 管理者於詳情頁為某會員勾選「講師」並儲存
- **THEN** 該會員身分集合加入 `teacher`，變更於下次請求即時生效

#### Scenario: 禁止移除自身管理身分
- **WHEN** 管理者嘗試移除「自己」的 `admin` 或 `superadmin` 身分
- **THEN** 系統拒絕並回傳 `{ success: false, message: '無法移除自己的管理員身分' }`

#### Scenario: 非管理者無法編輯身分
- **WHEN** 非 `canAccessAdmin` 的使用者呼叫身分編輯 Server Action
- **THEN** 回傳 `{ success: false, message: '無權限' }`

---

### Requirement: 重設臨時密碼並重新顯示
詳情頁 SHALL 提供「重設臨時密碼」按鈕，僅 `canAccessAdmin` 可使用。點擊後系統 SHALL 產生新臨時密碼、雜湊儲存、設 `isTempPassword=true`，並將新臨時密碼回傳供畫面重新顯示（不僅寄送 Email）。

#### Scenario: 重設並顯示新臨時密碼
- **WHEN** 管理者點擊「重設臨時密碼」
- **THEN** 系統產生新臨時密碼、設 `isTempPassword=true`，並於畫面顯示新密碼供轉交

#### Scenario: 重設後會員須改密
- **WHEN** 會員以重設後的臨時密碼登入
- **THEN** 因 `isTempPassword=true` 被導向變更密碼流程

#### Scenario: 非管理者無法重設
- **WHEN** 非 `canAccessAdmin` 的使用者呼叫重設 Server Action
- **THEN** 回傳 `{ success: false, message: '無權限' }`

### Requirement: 會員清單篩選與分頁
`/admin/members` 頁面 SHALL 提供下拉篩選：**性別**（全部／男／女／未指定）、**身分**（全部／一般會員／講師／管理者／超級管理者）、**所屬教會**（全部／各啟用教會／其他／無），與文字搜尋（`?q=`）以 AND 組合，皆以 URL 參數傳遞（`?gender=`、`?role=`、`?church=`、`?q=`、`?page=`）。
當 `q`／性別／身分／所屬教會皆未指定時，頁面 SHALL NOT 查詢或渲染會員清單，並顯示提示請使用者輸入搜尋或選擇篩選。
當任一條件存在時，清單 SHALL 每頁顯示最多 **30 筆**並支援翻頁；頁面 SHALL 顯示符合條件之總筆數與目前頁次。
變更任一篩選或搜尋條件時，頁碼 SHALL 重置為第 1 頁；`page` 超出有效範圍時 SHALL 夾在 `[1, 總頁數]`。

身分篩選採「包含」語意：選擇某身分時列出 `roles` 含該身分之會員。
所屬教會篩選：數字值對應 `churchId`；`other` 對應 `churchType=other`；`none` 對應 `churchType=none`。

#### Scenario: 未下任何條件不列清單
- **WHEN** 管理者進入 `/admin/members` 且未輸入搜尋、未選任何篩選
- **THEN** 不顯示會員清單，改顯示「請輸入搜尋或選擇篩選條件以顯示會員」提示

#### Scenario: 依性別篩選並分頁
- **WHEN** 管理者選擇性別「女」，符合者共有超過 30 筆
- **THEN** 清單顯示前 30 筆，並顯示總筆數與「第 1 / N 頁」，可點下一頁

#### Scenario: 多條件 AND 組合
- **WHEN** 管理者同時選擇身分「講師」與某一教會
- **THEN** 清單僅顯示 `roles` 含 teacher 且屬於該教會的會員

#### Scenario: 翻頁
- **WHEN** 管理者在第 1 頁點「下一頁」
- **THEN** URL `page` 加 1，清單顯示第 31–60 筆（其餘篩選條件保留）

#### Scenario: 變更篩選重置頁碼
- **WHEN** 管理者在第 3 頁變更任一篩選或搜尋條件
- **THEN** `page` 重置為 1

#### Scenario: 身分篩選為包含語意
- **WHEN** 管理者選擇身分「管理者」
- **THEN** 同時具備 admin 與其他身分的會員也會被列出

# admin-member-management Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for admin-member-management.
## Requirements
### Requirement: 會員清單搜尋
管理者 SHALL 能在 `/admin/members` 頁面透過搜尋列篩選會員，搜尋條件涵蓋 `realName`、`name`、`nickname`、`email`、`spiritId` 欄位（OR 邏輯、不分大小寫、部分匹配）。搜尋條件 SHALL 透過 URL query string `?q=` 傳遞，以支援書籤與重新整理保留。表格欄位順序 SHALL 為：啟動編號、姓名、Email、身分、操作（不再顯示「加入日期」欄位）。「身分」欄 SHALL 顯示該會員擁有的所有身分。Email 欄 SHALL 依機敏欄位遮蔽規則預設以 `***` 呈現、點擊逐筆切換檢視（見 admin-sensitive-masking），以 Email 為條件之搜尋比對 SHALL 不受遮蔽影響。

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

#### Scenario: Email 欄預設遮蔽
- **WHEN** 管理者進入 `/admin/members`
- **THEN** 每列 Email 欄顯示 `***`，點擊該欄後僅該列切換為明文

#### Scenario: 遮蔽不影響 Email 搜尋
- **WHEN** 管理者以部分 Email 字串搜尋
- **THEN** 系統照常回傳 `email` 匹配的會員，結果列之 Email 欄仍預設遮蔽

---

### Requirement: 會員詳情頁
系統 SHALL 提供 `/admin/members/[id]` 頁面，以四個分頁呈現：**基本資料**、**學習階層**、**講師身分**、**特殊設定**。非管理者存取 SHALL 被重新導向至 `/`。基本資料分頁 SHALL 顯示「電話」（`phone`）欄位；Email 與電話 SHALL 依機敏欄位遮蔽規則預設以 `***` 呈現、點擊切換檢視（見 admin-sensitive-masking）。
基本資料分頁 SHALL 顯示「年齡」欄位：依 `User.birthYear` 以「當年西元年 − birthYear」計算並以 `NN 歲` 格式顯示；`birthYear` 未填時顯示 `—`。
基本資料分頁的**學習紀錄**（作為學員之**已核准報名**課程，**含招生中**、進行中、已結業、已取消）與**授課紀錄**（自己建立之**所有**課程，**含招生中**與已取消）SHALL 以共用課程卡片元件 `CourseSessionCard` 之卡片牆呈現（手機單欄、桌機兩欄 grid），每張卡片顯示課程編號、課程標籤、課程狀態、報名人數／預計人數等標準卡片資訊，並 SHALL 連結至對應課程頁 `/course/{inviteId}`；排序 SHALL 為**招生中（未開課）在前**，其後依開課時間新→舊。學員**待審核（pending）**的報名 SHALL NOT 列入學習紀錄。無紀錄時 SHALL 分別顯示「尚無學習紀錄」／「尚無授課紀錄」。

#### Scenario: 顯示基本資料分頁
- **WHEN** 管理者進入 `/admin/members/[id]`
- **THEN** 基本資料分頁顯示：姓名（`realName`）、暱稱（`nickname`）、年齡（依 `birthYear` 計算）、Email（預設遮蔽）、電話（`phone`，預設遮蔽）、靈人編號（`spiritId`）、身分（所有 `roles`）、加入日期（`createdAt`）、學習紀錄（已核准報名之課程，含招生中）

#### Scenario: 年齡欄位顯示
- **WHEN** 會員的 `birthYear` 有值（如 1990，當年為 2026）
- **THEN** 基本資料顯示年齡 `36 歲`

#### Scenario: 年齡未填顯示破折號
- **WHEN** 會員的 `birthYear` 為 null
- **THEN** 年齡欄位顯示 `—`

#### Scenario: 招生中課程顯示於紀錄
- **WHEN** 會員為某招生中課程（`startedAt == null`）的已核准學員、或建立了招生中課程
- **THEN** 該課程以卡片顯示於學習紀錄／授課紀錄，狀態標籤為「招生中」，且排在已開課課程之前

#### Scenario: 待審核報名不列入
- **WHEN** 會員對某課程的報名 `status = 'pending'`
- **THEN** 該課程不出現在學習紀錄

#### Scenario: 學習紀錄以課程卡片呈現
- **WHEN** 管理者檢視基本資料分頁且該會員有已核准報名的課程
- **THEN** 學習紀錄區塊以 `CourseSessionCard` 卡片牆顯示各課程（含課程編號、標籤、狀態、人數），點擊卡片導向 `/course/{inviteId}`

#### Scenario: 授課紀錄以課程卡片呈現
- **WHEN** 管理者檢視基本資料分頁且該會員有建立的課程
- **THEN** 授課紀錄區塊以 `CourseSessionCard` 卡片牆顯示各課程（含課程編號、標籤、狀態、人數），點擊卡片導向 `/course/{inviteId}`

#### Scenario: 無紀錄空狀態
- **WHEN** 會員無學習紀錄或無授課紀錄
- **THEN** 對應區塊顯示「尚無學習紀錄」／「尚無授課紀錄」

#### Scenario: 四個分頁可切換
- **WHEN** 管理者於詳情頁切換分頁
- **THEN** 可在基本資料／學習階層／講師身分／特殊設定間切換，各自顯示對應內容

#### Scenario: 找不到會員
- **WHEN** URL 中的 id 不存在
- **THEN** 頁面顯示 404 或重新導向至 `/admin/members`

#### Scenario: 詳情頁機敏欄位點擊檢視
- **WHEN** 管理者於基本資料分頁點擊遮蔽中的 Email 或電話
- **THEN** 該欄位切換為明文，另一欄位維持原狀態（獨立切換）

#### Scenario: 電話未填顯示破折號
- **WHEN** 會員的 `phone` 為空
- **THEN** 電話欄位顯示 `—`，無遮蔽互動


### Requirement: 條件式會員刪除
系統 SHALL 僅在環境變數 `ENABLE_MEMBER_DELETE=true` 時於詳情頁顯示刪除按鈕。刪除前 SHALL 顯示 AlertDialog 二次確認，確認後執行 hard delete。刪除操作 SHALL 於同一交易內寫入一筆 `AdminActionLog`（`action = member_delete`，含操作者與被刪除帳號之文字快照），刪除與稽核紀錄寫入 SHALL 視為單一原子操作——任一方失敗即整體回滾。

#### Scenario: 刪除按鈕依環境變數顯示
- **WHEN** `ENABLE_MEMBER_DELETE` 未設定或不為 `'true'`
- **THEN** 詳情頁不渲染任何刪除相關 UI

#### Scenario: 刪除確認流程
- **WHEN** 管理者點擊刪除按鈕並在 AlertDialog 確認
- **THEN** 系統呼叫 `deleteMember(userId)` Server Action，刪除成功後重新導向至 `/admin/members`

#### Scenario: 取消刪除
- **WHEN** 管理者在 AlertDialog 點擊取消
- **THEN** 關閉 dialog，不執行任何刪除動作

#### Scenario: 刪除成功寫入稽核紀錄
- **WHEN** 管理者確認刪除某會員且刪除成功
- **THEN** 系統寫入一筆 `AdminActionLog`（`action = member_delete`），含操作者姓名、被刪除帳號姓名與 email 之文字快照

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
詳情頁 SHALL 讓 `canAccessAdmin` 的使用者編輯會員的身分集合（加掛或移除 `teacher_1`／`teacher_2`／`teacher_3`／`admin`／`superadmin`），`user` 基線恆保留。三個書籍講師身分 SHALL 各自獨立加掛或移除。系統 SHALL NOT 允許管理者移除「自己」的 `admin` 或 `superadmin` 身分（防止把自己鎖在後台外），UI 與 Server Action 皆需防呆。

#### Scenario: 加掛書籍講師身分
- **WHEN** 管理者於詳情頁為某會員勾選「啟動豐盛講師」並儲存
- **THEN** 該會員身分集合加入 `teacher_2`，變更於下次請求即時生效

#### Scenario: 獨立移除單一書籍講師身分
- **WHEN** 某會員同時具備 `teacher_1` 與 `teacher_2`，管理者僅取消勾選「啟動豐盛講師」並儲存
- **THEN** 該會員身分集合保留 `teacher_1`，移除 `teacher_2`

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
`/admin/members` 頁面 SHALL 提供下拉篩選：**性別**（全部／男／女／未指定）、**身分**（全部／一般會員／啟動靈人講師／啟動豐盛講師／啟動得勝講師／管理者／超級管理者）、**所屬教會**（全部／各啟用教會／其他／無），與文字搜尋（`?q=`）以 AND 組合，皆以 URL 參數傳遞（`?gender=`、`?role=`、`?church=`、`?q=`、`?page=`）。
當 `q`／性別／身分／所屬教會皆未指定時，頁面 SHALL NOT 查詢或渲染會員清單，並顯示提示請使用者輸入搜尋或選擇篩選。
當任一條件存在時，清單 SHALL 每頁顯示最多 **30 筆**並支援翻頁；頁面 SHALL 顯示符合條件之總筆數與目前頁次。
變更任一篩選或搜尋條件時，頁碼 SHALL 重置為第 1 頁；`page` 超出有效範圍時 SHALL 夾在 `[1, 總頁數]`。

身分篩選採「包含」語意：選擇某身分時列出 `roles` 含該身分之會員（書籍講師身分對應 `teacher_1`～`teacher_3`）。
所屬教會篩選：數字值對應 `churchId`；`other` 對應 `churchType=other`；`none` 對應 `churchType=none`。

#### Scenario: 未下任何條件不列清單
- **WHEN** 管理者進入 `/admin/members` 且未輸入搜尋、未選任何篩選
- **THEN** 不顯示會員清單，改顯示「請輸入搜尋或選擇篩選條件以顯示會員」提示

#### Scenario: 依性別篩選並分頁
- **WHEN** 管理者選擇性別「女」，符合者共有超過 30 筆
- **THEN** 清單顯示前 30 筆，並顯示總筆數與「第 1 / N 頁」，可點下一頁

#### Scenario: 依書籍講師身分篩選
- **WHEN** 管理者選擇身分「啟動豐盛講師」
- **THEN** 清單僅顯示 `roles` 含 `teacher_2` 的會員

#### Scenario: 多條件 AND 組合
- **WHEN** 管理者同時選擇身分「啟動靈人講師」與某一教會
- **THEN** 清單僅顯示 `roles` 含 `teacher_1` 且屬於該教會的會員

### Requirement: 會員授課老師編號顯示
會員詳情頁基本資料區 SHALL 顯示「授課老師編號」（`teacherNo`），無值時顯示「—」。會員 Excel 匯出 SHALL 新增「授課老師編號」欄。

#### Scenario: 詳情頁顯示授課老師編號
- **WHEN** 管理者開啟具 `teacherNo` 的教師之會員詳情頁
- **THEN** 基本資料區顯示「授課老師編號」及其值（如 `A001`）

#### Scenario: 無編號顯示破折號
- **WHEN** 管理者開啟純學員（`teacherNo = null`）的詳情頁
- **THEN** 「授課老師編號」欄顯示「—」

#### Scenario: 匯出含授課老師編號欄
- **WHEN** 管理者匯出會員 Excel
- **THEN** 檔案包含「授課老師編號」欄，教師列填入其編號、學員列為空

#### Scenario: 翻頁
- **WHEN** 管理者在第 1 頁點「下一頁」
- **THEN** URL `page` 加 1，清單顯示第 31–60 筆（其餘篩選條件保留）

#### Scenario: 變更篩選重置頁碼
- **WHEN** 管理者在第 3 頁變更任一篩選或搜尋條件
- **THEN** `page` 重置為 1

#### Scenario: 身分篩選為包含語意
- **WHEN** 管理者選擇身分「管理者」
- **THEN** 同時具備 admin 與其他身分的會員也會被列出

### Requirement: 講師身分分頁 — 推薦歷程
講師身分分頁 SHALL 唯讀顯示「推薦歷程」：他人（各課程老師）推薦此會員成為講師的回饋紀錄，來源為 `InviteEnrollment.teacherRecommended = true`（此會員為學員），欄位包含推薦書別（依課程 `courseCatalogId`）、備註（`teacherFeedbackNote`）、推薦老師（`CourseInvite.createdBy` 顯示名稱）、時間（`teacherFeedbackAt`）。

#### Scenario: 顯示推薦歷程
- **WHEN** 管理者開啟某會員的講師身分分頁，且該會員曾被推薦
- **THEN** 列出每筆推薦的書別、備註、推薦老師與時間

#### Scenario: 無推薦時顯示佔位
- **WHEN** 該會員未曾被任何老師推薦
- **THEN** 推薦歷程區顯示「尚無推薦紀錄」

### Requirement: 講師身分分頁 — 卡片式授權與確認
講師身分分頁 SHALL 以卡片呈現三本書講師身分（`teacher_1`～`teacher_3`），顯示是否已授權。點擊卡片授予/移除 SHALL 先顯示確認對話框，確認後始執行。授予講師身分成功後，系統 SHALL 寄送「{書名}講師資格授權通知」信給該會員（收件依 `resolveContactEmail`）；移除不寄信。

#### Scenario: 授予講師身分並發信
- **WHEN** 管理者點擊某書講師卡片授予並於確認對話框確認
- **THEN** 該會員 `roles` 加入對應 `teacher_N`，並寄送授權通知信至其收件地址

#### Scenario: 移除講師身分不發信
- **WHEN** 管理者移除某書講師身分並確認
- **THEN** 該會員 `roles` 移除對應 `teacher_N`，不寄信

#### Scenario: 未確認不執行
- **WHEN** 管理者於確認對話框取消
- **THEN** 身分不變更

### Requirement: 特殊設定分頁
特殊設定分頁 SHALL 提供：**暫停會員／恢復會員**（見 member-suspension）、**補發密碼**（重設臨時密碼並重新顯示）、**帳號修改**（變更會員登入 email，顯示目前帳號、輸入新 email、確認視窗後生效，行為依 `account-email-change` 共通規則）、**特殊身分授權**（授予/移除 `admin`、`superadmin`，依 member-roles 權限分級）。

#### Scenario: 補發密碼
- **WHEN** 管理者於特殊設定點「補發密碼」並確認
- **THEN** 重設臨時密碼並重新顯示一次，會員下次登入須重設

#### Scenario: 帳號修改
- **WHEN** 管理者於特殊設定輸入新 email 並於確認視窗（新舊 email 並列）確認
- **THEN** 該會員登入 email 依 `account-email-change` 共通規則變更，畫面更新顯示新帳號

#### Scenario: 特殊身分授權依權限分級
- **WHEN** 管理者於特殊設定授予/移除 `admin`／`superadmin`
- **THEN** 依 member-roles「身分授權權限分級」判定是否允許（`admin` 不可授 `superadmin`）

#### Scenario: 暫停與恢復入口
- **WHEN** 管理者檢視特殊設定分頁
- **THEN** 未暫停者顯示「暫停會員」（原因下拉＋自填），暫停中者顯示暫停資訊與「恢復會員」

### Requirement: 會員詳情頁活躍度指標
會員詳情頁基本資料分頁 SHALL 顯示三個獨立的活躍度指標：
- **最後登入時間**（`lastLoginAt`）與**上次登入時間**（`previousLoginAt`）：有值時格式化顯示，無值時顯示「—」。
- **是否完成首次登入**：依 `lastLoginAt` 是否為 null 判定（非 null → 「已完成」；null → 「尚未登入」）。
- **是否完成首次補填基本資料**：依 `realName` 與 `phone` 是否皆已填寫判定（皆有 → 「已補填」；任一缺 → 「尚未補填」）。
- **是否已更改臨時密碼**：依 `passwordHash` 與 `isTempPassword` 判定：`passwordHash` 為 null → 「不適用」；`passwordHash` 非 null 且 `isTempPassword` 為 true → 「尚未更改」；`passwordHash` 非 null 且 `isTempPassword` 為 false → 「已更改」。

這三個指標 SHALL 各自獨立呈現，不以其中一項代替另一項。

#### Scenario: 顯示最後登入與上次登入時間
- **WHEN** 管理者開啟一位已登入兩次以上會員的詳情頁
- **THEN** 基本資料分頁顯示其「最後登入時間」與「上次登入時間」

#### Scenario: 從未登入者顯示尚未登入
- **WHEN** 管理者開啟一位 `lastLoginAt` 為 null 的會員詳情頁
- **THEN** 「是否完成首次登入」顯示「尚未登入」，且最後登入／上次登入時間皆顯示「—」

#### Scenario: 已補填基本資料
- **WHEN** 管理者開啟一位 `realName` 與 `phone` 皆有值的會員詳情頁
- **THEN** 「是否完成首次補填基本資料」顯示「已補填」

#### Scenario: 尚未補填基本資料
- **WHEN** 管理者開啟一位 `realName` 或 `phone` 任一缺失的會員詳情頁
- **THEN** 「是否完成首次補填基本資料」顯示「尚未補填」

#### Scenario: 已更改臨時密碼
- **WHEN** 管理者開啟一位 `passwordHash` 非 null 且 `isTempPassword` 為 false 的會員詳情頁
- **THEN** 「是否已更改臨時密碼」顯示「已更改」

#### Scenario: 尚未更改臨時密碼
- **WHEN** 管理者開啟一位 `passwordHash` 非 null 且 `isTempPassword` 為 true 的會員詳情頁
- **THEN** 「是否已更改臨時密碼」顯示「尚未更改」

#### Scenario: 無密碼帳號顯示不適用
- **WHEN** 管理者開啟一位 `passwordHash` 為 null（純 Google 帳號）的會員詳情頁
- **THEN** 「是否已更改臨時密碼」顯示「不適用」

---

### Requirement: 會員匯出活躍度欄位
會員 Excel 匯出 SHALL 新增「上次登入」「已完成首次登入」「已完成首次補填」「已更改臨時密碼」欄位（既有「最後登入」欄保留）。各欄判定規則與詳情頁活躍度指標一致。

#### Scenario: 匯出含活躍度欄位
- **WHEN** 管理者匯出會員 Excel
- **THEN** 檔案包含「最後登入」「上次登入」「已完成首次登入」「已完成首次補填」「已更改臨時密碼」欄位

#### Scenario: 匯出值與詳情頁判定一致
- **WHEN** 匯出某 `passwordHash` 為 null 的會員
- **THEN** 其「已更改臨時密碼」欄顯示「不適用」，「已完成首次登入」「已完成首次補填」依各自規則填入


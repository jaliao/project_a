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
系統 SHALL 僅在環境變數 `ENABLE_MEMBER_DELETE=true` 時於詳情頁顯示刪除按鈕。刪除前 SHALL 顯示 AlertDialog 二次確認，確認後執行 hard delete。刪除操作 SHALL 於同一交易內寫入一筆 `AdminActionLog`（`action = member_delete`，含操作者與被刪除帳號之文字快照），刪除與稽核紀錄寫入 SHALL 視為單一原子操作——任一方失敗即整體回滾。刪除過程中若因外鍵約束（`RESTRICT`）而無法刪除，系統 SHALL 攔截該錯誤並回傳具體的繁體中文失敗原因，不得讓例外未經處理直接中斷 Server Action；無法判斷具體原因時 SHALL 回傳通用但誠實的失敗訊息，不得顯示成功。

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

#### Scenario: 因班級仍有其他學員報名而刪除失敗
- **WHEN** 管理者嘗試刪除一個具講師身分、且其建立的班級（`CourseInvite`）底下仍有其他學員報名記錄（`InviteEnrollment`）尚未清除的會員
- **THEN** 刪除失敗，畫面顯示說明此會員是班級建立者、班級下仍有其他學員資料的具體中文訊息，會員帳號未被刪除

#### Scenario: 因曾發起站內對話而刪除失敗
- **WHEN** 管理者嘗試刪除一個曾發起過站內對話（`Conversation.createdById`）的會員
- **THEN** 刪除失敗，畫面顯示說明此會員曾發起站內對話而無法刪除的具體中文訊息，會員帳號未被刪除

#### Scenario: 因曾於站內對話發過訊息而刪除失敗
- **WHEN** 管理者嘗試刪除一個曾在站內對話中發過訊息（`ConversationMessage.authorId`）的會員
- **THEN** 刪除失敗，畫面顯示說明此會員曾發過站內訊息而無法刪除的具體中文訊息，會員帳號未被刪除

#### Scenario: 因曾於課程留言功能發過留言而刪除失敗
- **WHEN** 管理者嘗試刪除一個曾在課程留言功能發過留言（`CourseMessage.authorId`）的會員
- **THEN** 刪除失敗，畫面顯示說明此會員曾發過課程留言而無法刪除的具體中文訊息，會員帳號未被刪除

#### Scenario: 因未分類的關聯資料而刪除失敗
- **WHEN** 管理者嘗試刪除一個因外鍵約束而失敗、但該約束不在系統已知對照表中的會員
- **THEN** 刪除失敗，畫面顯示通用但誠實的失敗訊息（說明仍有其他系統資料關聯、請聯繫工程協助），不得顯示為刪除成功，且完整錯誤資訊會被記錄供後續排查

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

### Requirement: 合併帳號
會員詳情頁「特殊設定」分頁 SHALL 顯示「合併帳號」操作入口（不受 `ENABLE_MEMBER_DELETE` 環境變數限制），管理者點擊後 SHALL 能以通用會員搜尋元件（模糊搜尋啟動編號／姓名／暱稱／登入 Email）選定另一筆既有會員帳號；後台「疑似重複帳號」清單（見 `admin-duplicate-account-detection`）的每組候選亦 SHALL 提供直接開啟此對話框並帶入該組兩筆帳號的連結，略過搜尋步驟。

選定兩筆帳號後，系統 SHALL 判定主/副帳號：若兩筆帳號其中恰好一筆 email 符合 `isUndeliverableEmail`（合成 seed 信箱），SHALL 預設該筆為副帳號、另一筆為主帳號；其餘情況（兩筆皆為合成信箱或皆非合成信箱）SHALL NOT 給預設值，管理者必須手動指定哪一筆為主帳號。管理者 SHALL 能隨時對調預設的主/副帳號方向。

確定主/副帳號後，系統 SHALL 顯示合併預覽，內容包含：
1. 副帳號名下各類關聯資料筆數（課程報名、結業紀錄、好友關係、留言、對話、提問、學習紀錄、通知、推播訂閱）。
2. Unique 衝突清單：若雙方對同一課程目錄皆有結業證書製作紀錄（`CertificateProduction`）、雙方皆有上課意願刊登（`LearningIntent`），或雙方對同一班級皆有報名記錄（`InviteEnrollment`），SHALL 逐筆列出雙方內容，要求管理者選擇保留主帳號或副帳號的那一筆；任一衝突未選擇前 SHALL 無法送出合併。
3. `roles`（多重身分）與 `learningLevel`（學習等級）的合併建議：`roles` SHALL 預設為雙方聯集、`learningLevel` SHALL 預設為兩者較高值，管理者 SHALL 能於送出前手動調整。
4. 個人資料補空值清單：主帳號之 `phone`、`churchType`/`churchId`/`churchOther`（視為一組）、`englishName`、`gender`（`unspecified` 視為空）、`birthYear`、`teacherNo`，若為空且副帳號對應欄位有值，SHALL 列為「將補上」；主帳號已有值的欄位 SHALL NOT 出現在此清單、SHALL NOT 被覆蓋。

管理者確認合併後，系統 SHALL 於單一資料庫交易內完成：
- 好友關係（`Friendship`）：副帳號為擁有者或被加入對象的紀錄改為指向主帳號；合併後會變成自我關係（`ownerId === friendId`）或與主帳號既有關係重複（違反 `[ownerId, friendId]` 唯一限制）的紀錄 SHALL 被捨棄，不保留重複或自我關係。
- 對話參與者（`ConversationParticipant`）：副帳號的參與紀錄改為指向主帳號；若主帳號已是同一對話的參與者（違反 `[conversationId, userId]` 唯一限制），副帳號那筆重複紀錄 SHALL 被捨棄。
- 課程報名（`InviteEnrollment`）、結業證書（`CertificateProduction`）、上課意願（`LearningIntent`）：依管理者於預覽階段選擇保留的一側套用，未被選擇保留的那一筆 SHALL 被捨棄；其餘（未衝突的）紀錄之 `userId`／`producedById` 改為指向主帳號。
- 其餘關聯表（課程留言、對話、訊息、學習歷程回饋、聯繫管理者提問、學習紀錄筆記、通知、推播訂閱等之 `userId`／`createdById`／`authorId`／`resolvedById`／`repliedById`）SHALL 改為指向主帳號；`Account`（OAuth 綁定）與課程 FAQ 留言（`CourseMessage.authorId`，已下架功能）SHALL NOT 搬動，維持指向副帳號。
- 主帳號之 `roles`／`learningLevel` SHALL 更新為管理者確認的合併結果；`phone`、`churchType`/`churchId`/`churchOther`、`englishName`、`gender`、`birthYear`、`teacherNo` 中，主帳號原為空且副帳號有值者 SHALL 補上副帳號的值，主帳號已有值的欄位 SHALL NOT 被覆蓋。
- 副帳號 SHALL 標記 `mergedIntoId`（指向主帳號）、`mergedAt`、`mergedById`（操作管理者），SHALL NOT 刪除該筆 `User` 紀錄。
- SHALL 寫入一筆 `AdminActionLog`（`action = member_merge`），記錄主/副帳號與操作者。

送出合併前，系統 SHALL 重新查詢一次雙方帳號與所有衝突項目；若與預覽時不一致（例如出現新的未解決衝突、任一帳號已不存在或已被合併），SHALL 拒絕整個交易並提示管理者重新預覽，不猜測處理、不執行部分搬動。

合併 SHALL 僅限管理者（`admin`／`superadmin`）執行；主帳號與副帳號 SHALL 不可相同；任一方若已處於 `mergedIntoId` 非 null 狀態（已是某次合併的副帳號）SHALL 被拒絕，不支援合併鏈。

若副帳號 email 符合 `isUndeliverableEmail`，合併畫面 SHALL NOT 顯示通知選項；否則 SHALL 顯示「通知副帳號使用者改用新帳號登入」勾選框（預設不勾），管理者勾選並送出合併後，系統 SHALL 以 `resolveContactEmail()` 解析副帳號之收件地址寄送通知信。

#### Scenario: 顯示合併入口
- **WHEN** 管理者檢視任一會員詳情頁的「特殊設定」分頁
- **THEN** 顯示「合併帳號」按鈕，不受 `ENABLE_MEMBER_DELETE` 設定值影響

#### Scenario: 合成信箱帳號預設為副帳號
- **WHEN** 管理者選定兩筆帳號，其中恰好一筆 email 為 `{spiritId}@seed.iwillshare.org.tw`
- **THEN** 系統預設該筆為副帳號、另一筆為主帳號，管理者可對調

#### Scenario: 兩邊皆非合成信箱時強制手動指定
- **WHEN** 管理者選定兩筆帳號，皆非合成信箱
- **THEN** 系統不給預設方向，管理者必須手動指定哪一筆為主帳號才能繼續

#### Scenario: 由疑似重複帳號清單直接開啟並帶入雙方
- **WHEN** 管理者於「疑似重複帳號」清單點擊某組候選的「合併這兩筆帳號」連結
- **THEN** 合併對話框開啟並已帶入該組兩筆帳號，不需重新搜尋

#### Scenario: 結業證書衝突需管理者選邊
- **WHEN** 預覽發現雙方對同一課程目錄皆有結業證書製作紀錄
- **THEN** 系統列出雙方紀錄內容，要求管理者選擇保留其中一筆，未選擇前無法送出合併

#### Scenario: 好友關係自動去重，不要求選邊
- **WHEN** 副帳號與某會員的好友關係，在改指向主帳號後會與主帳號既有的好友關係重複，或變成自我關係
- **THEN** 系統自動捨棄該筆重複或自我關係紀錄，不要求管理者額外選擇

#### Scenario: 確認合併後資料正確搬動
- **WHEN** 管理者解決所有衝突、確認 roles／learningLevel 合併結果後送出合併
- **THEN** 副帳號名下未衝突的關聯資料改指向主帳號，副帳號標記 `mergedIntoId`／`mergedAt`／`mergedById` 但未被刪除，寫入一筆 `AdminActionLog`（`action = member_merge`）

#### Scenario: 主帳號缺漏欄位由副帳號補上
- **WHEN** 主帳號 `phone` 為空、副帳號 `phone` 有值，管理者確認合併
- **THEN** 合併後主帳號 `phone` 更新為副帳號原本的值

#### Scenario: 主帳號已有值的欄位不被覆蓋
- **WHEN** 主帳號與副帳號皆有 `englishName`，兩者內容不同
- **THEN** 合併後主帳號 `englishName` 維持原值，不被副帳號的值覆蓋

#### Scenario: 送出前資料已變動則拒絕
- **WHEN** 管理者於預覽後、確認送出前，副帳號又新增了一筆未被預覽涵蓋的衝突資料
- **THEN** 系統拒絕整個合併交易，提示管理者重新預覽，不執行任何部分搬動

#### Scenario: 不支援合併鏈
- **WHEN** 管理者嘗試將某帳號（已是另一次合併的副帳號，`mergedIntoId` 非 null）指定為本次合併的主帳號或副帳號
- **THEN** 系統拒絕此次合併，不執行任何資料異動

#### Scenario: 合成信箱副帳號不提供通知選項
- **WHEN** 副帳號 email 符合 `isUndeliverableEmail`
- **THEN** 合併預覽畫面不顯示「通知副帳號使用者」勾選框

#### Scenario: 真實信箱副帳號可選擇通知
- **WHEN** 副帳號 email 不符合 `isUndeliverableEmail`，管理者勾選「通知副帳號使用者改用新帳號登入」並送出合併
- **THEN** 合併成功後，系統以 `resolveContactEmail()` 解析之副帳號收件地址寄送通知信

#### Scenario: 非管理者無法執行合併
- **WHEN** 不具管理者身分的使用者嘗試呼叫合併相關 Server Action
- **THEN** 系統拒絕並回傳無權限訊息，不執行任何資料異動

### Requirement: 合併帳號登入阻擋
帳號之 `mergedIntoId` 非 null（已被標記為某次合併的副帳號）時，SHALL 無法再登入系統，無論透過 Google OAuth 或密碼登入。

新登入嘗試 SHALL 於 NextAuth `signIn` callback 階段即被拒絕並導向獨立頁面「此帳號已併入其他帳號」（比照 `/account-suspended` 的獨立頁面與訊息模式）。已登入中的既有 session SHALL 於下一次對受保護頁面的請求中被即時擋下（比照 `suspendedAt` 的即時阻擋機制：於 `(user)/layout.tsx` 查詢該帳號之 `mergedIntoId`，非 null 時導向登出路由，清除 session cookie 後導向同一獨立頁面），不需等待 session 過期或重新登入才生效。

#### Scenario: 已合併帳號無法以密碼重新登入
- **WHEN** 已被標記 `mergedIntoId` 的帳號嘗試以 Email + 密碼登入
- **THEN** 登入被拒絕，導向「此帳號已併入其他帳號」頁面

#### Scenario: 已合併帳號無法以 Google 登入
- **WHEN** 已被標記 `mergedIntoId` 的帳號嘗試以 Google OAuth 登入
- **THEN** 登入被拒絕，導向「此帳號已併入其他帳號」頁面

#### Scenario: 合併後既有 session 即時失效
- **WHEN** 某帳號在登入狀態下被管理者合併為副帳號（標記 `mergedIntoId`）
- **THEN** 該帳號下一次對任何受保護頁面的請求，即被導向登出路由並清除 session，隨後顯示「此帳號已併入其他帳號」頁面，不需等待原 session 過期

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

### Requirement: 會員首頁快捷入口

後台會員／講師相關的清單與詳情畫面 SHALL 提供一顆「會員首頁」按鈕，連往該會員的前台個人首頁 `/user/<spiritId 小寫>`（即 `app/[locale]/(user)/user/[spiritId]/page.tsx`）。

- 按鈕 SHALL 出現在下列位置的既有操作區，緊鄰「查看詳情」：
  - `/admin/members` 搜尋結果每列的「操作」欄；
  - `/admin/members/inactive` 未啟用會員每列的「操作」欄；
  - `/admin/members/[id]` 詳情頁頁首列。
- 連結 `href` SHALL 為 `/user/` 串接該會員 `spiritId` 的**小寫**字串（與 `components/layout/topbar.tsx` 產生會員首頁網址的慣例一致）。
- 按鈕 SHALL 於**新分頁**開啟（`target="_blank"`、`rel="noopener noreferrer"`），使管理者不離開目前的搜尋／篩選或詳情畫面。
- 當該會員 `spiritId` 為 null 或空字串時，按鈕 SHALL 呈現為停用（`disabled`）狀態且不產生連結，並提供提示文字說明「此會員尚無啟動編號」。
- 此入口為唯讀瀏覽既有頁面，SHALL NOT 以該會員身分登入或模擬其 session。
- 按鈕文字與提示 SHALL 以繁體中文直接呈現（後台專屬字串本階段不 i18n key 化）。

#### Scenario: 從搜尋結果進入會員首頁
- **WHEN** 管理者在 `/admin/members` 搜尋到一位具啟動編號 `PA260001` 的會員，點擊該列的「會員首頁」按鈕
- **THEN** 於新分頁開啟 `/user/pa260001`，顯示該會員的前台個人首頁；原搜尋結果分頁維持不變

#### Scenario: 詳情頁頁首的會員首頁按鈕
- **WHEN** 管理者位於 `/admin/members/<id>` 詳情頁，且該會員有啟動編號
- **THEN** 頁首列顯示「會員首頁」按鈕，點擊後於新分頁開啟該會員 `/user/<spiritId 小寫>`

#### Scenario: 會員無啟動編號時停用
- **WHEN** 清單中某會員（例如未啟用、從未登入）`spiritId` 為 null
- **THEN** 該列「會員首頁」按鈕呈現停用狀態、不可點擊、無 `href`，滑鼠停留顯示「此會員尚無啟動編號」

#### Scenario: 啟動編號大小寫正規化
- **WHEN** 會員的 `spiritId` 在資料庫存為大寫 `PA260123`
- **THEN** 「會員首頁」按鈕的連結為 `/user/pa260123`（小寫），可正確開啟該會員首頁

### Requirement: 班級轉移
會員詳情頁「授課紀錄」區塊 SHALL 在該會員名下有至少一個班級（`CourseInvite`）時顯示「轉移班級」操作入口。管理者點擊後 SHALL 能以勾選清單選擇要轉移的班級（預設全選，可取消勾選排除特定班級）並選擇目標老師，確認後系統 SHALL 將勾選班級的建立者（`CourseInvite.createdById`）改為目標老師。此操作 SHALL 僅限管理者（`admin`／`superadmin`）執行，不開放一般老師對自己或他人名下班級執行轉移。

目標老師 SHALL 針對勾選班級涵蓋的每個課程目錄（`courseCatalogId`），實際持有對應的書籍講師身分（`teacher_1`／`teacher_2`／`teacher_3`）；僅具備後台管理者身分但未持有對應書籍講師身分者，不視為合格目標老師。任一班級所需身分目標老師未持有時，系統 SHALL 拒絕整批轉移並列出缺少的書籍名稱，不得只轉移部分班級。

轉移成功 SHALL 於單一交易內完成資料異動，且針對每個被轉移的班級各寫入一筆 `AdminActionLog`（`action = course_invite_transfer`），含操作者、目標老師（文字快照）、被轉移班級（`inviteId`/`inviteTitle`）與來源老師（文字快照於 `detail`）。

#### Scenario: 顯示轉移入口
- **WHEN** 管理者檢視一個具備至少一個班級的會員詳情頁
- **THEN** 「授課紀錄」區塊顯示「轉移班級」按鈕

#### Scenario: 無班級時不顯示轉移入口
- **WHEN** 管理者檢視一個沒有任何班級的會員詳情頁
- **THEN** 「授課紀錄」區塊不顯示「轉移班級」按鈕

#### Scenario: 預設全選班級清單
- **WHEN** 管理者點擊「轉移班級」開啟 Dialog
- **THEN** 該會員名下所有班級以勾選清單呈現，且預設全部勾選

#### Scenario: 可取消勾選排除特定班級
- **WHEN** 管理者在清單中取消勾選某幾個班級
- **THEN** 確認轉移後，僅勾選的班級被轉移，未勾選的班級仍屬於原老師

#### Scenario: 目標老師具備對應身分時轉移成功
- **WHEN** 管理者勾選一個或多個班級、選定一位實際具備這些班級所需書籍講師身分的老師並確認
- **THEN** 勾選班級的 `CourseInvite.createdById` 全部改為該老師，系統顯示轉移成功訊息，且每個被轉移的班級各寫入一筆 `AdminActionLog`（`action = course_invite_transfer`）

#### Scenario: 目標老師缺少對應身分時整批拒絕
- **WHEN** 管理者勾選的班級涵蓋某個課程目錄、但選定的目標老師未實際持有該課程目錄對應的書籍講師身分
- **THEN** 轉移失敗，系統顯示列出缺少身分之書籍名稱的具體中文訊息，所有勾選班級皆未被轉移

#### Scenario: 僅具管理者身分但無對應書籍講師身分者不符資格
- **WHEN** 選定的目標老師具備 `admin` 或 `superadmin` 身分，但未持有勾選班級所需的書籍講師身分
- **THEN** 轉移失敗，不因其管理者身分而放行（管理者身分不視為書籍講師身分的替代）

#### Scenario: 非管理者無法執行轉移
- **WHEN** 一般老師（無 `admin`／`superadmin` 身分）嘗試呼叫轉移班級的 Server Action
- **THEN** 系統拒絕並回傳無權限訊息，不執行任何資料異動

#### Scenario: 轉移後原班級學員報名與結業紀錄不受影響
- **WHEN** 某班級已有學員報名記錄（`InviteEnrollment`）或結業紀錄
- **THEN** 轉移該班級的建立者後，這些學員的報名記錄、結業紀錄維持不變，僅 `CourseInvite.createdById` 改變


## MODIFIED Requirements

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

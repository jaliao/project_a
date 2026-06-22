## MODIFIED Requirements

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

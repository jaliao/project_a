## ADDED Requirements

### Requirement: 封存課程按鈕與確認 Dialog
課程詳情頁底部管理操作區塊 SHALL 顯示「封存課程」／「解除封存」按鈕，**僅 `admin` 或 `superadmin` 身分可見**（一般講師身分即使為該課建立者亦不可見）。點擊「封存課程」SHALL 彈出確認 Dialog，可填寫封存原因（選填）；封存不限課程狀態（招生中／進行中／已結業／已取消皆可操作），且可重複解除。

#### Scenario: 管理者可見封存按鈕
- **WHEN** `admin` 或 `superadmin` 檢視任一課程詳情頁
- **THEN** 頁面底部管理操作區塊顯示「封存課程」（若尚未封存）或「解除封存」（若已封存）按鈕

#### Scenario: 一般講師不可見封存按鈕
- **WHEN** 不具 `admin`／`superadmin` 身分的講師（含該課建立者）檢視課程詳情頁
- **THEN** 頁面不顯示封存／解除封存按鈕

#### Scenario: 開啟封存確認 Dialog
- **WHEN** 管理者點擊「封存課程」按鈕
- **THEN** 系統彈出確認 Dialog，標題為「確認封存課程」，提供選填的封存原因欄位

#### Scenario: 點擊取消關閉 Dialog
- **WHEN** 管理者點擊 Dialog 中的「取消」或關閉按鈕
- **THEN** Dialog 關閉，課程封存狀態不受影響

### Requirement: 執行封存／解除封存課程
確認送出後，系統 SHALL 將 `CourseInvite.archivedAt` 設為當前時間、`archiveReason` 寫入原因文字（未填則為 null），並重新整理頁面；已封存課程的報名、教材、留言等關聯資料 SHALL 完全保留不受影響。解除封存 SHALL 將 `archivedAt`／`archiveReason` 清空。封存／解除封存 Server Action 的守衛 SHALL 為 `canAccessAdmin`。

#### Scenario: 封存成功
- **WHEN** 管理者於未封存課程填寫（或略過）原因並點擊確認
- **THEN** 系統更新 `CourseInvite`（`archivedAt` = now，`archiveReason` = 原因文字或 null），顯示「課程已封存」toast，頁面刷新顯示已封存狀態

#### Scenario: 解除封存成功
- **WHEN** 管理者於已封存課程點擊「解除封存」並確認
- **THEN** 系統清空 `archivedAt`／`archiveReason`，顯示「已解除封存」toast，課程回到原本狀態顯示

#### Scenario: 封存不影響關聯資料
- **WHEN** 課程被封存
- **THEN** 該課程的報名紀錄、教材指派、課程留言、結業標記等既有資料不變

#### Scenario: 無權限者無法封存
- **WHEN** 非 `admin`／`superadmin` 身分呼叫封存或解除封存 Server Action
- **THEN** 回傳無權限錯誤，封存狀態不變

#### Scenario: 封存失敗（伺服器錯誤）
- **WHEN** Server Action 回傳錯誤
- **THEN** 顯示「操作失敗，請稍後再試」toast，Dialog 維持開啟

### Requirement: 刪除課程按鈕與確認 Dialog
課程詳情頁底部管理操作區塊 SHALL 顯示「刪除課程」按鈕，**僅 `admin` 或 `superadmin` 身分可見**。點擊「刪除課程」SHALL 彈出確認 Dialog，明確列出即將被永久刪除的報名筆數與其中已結業人數，並提示此操作不可回復、可能影響學員的學習歷程與證書資格判斷。刪除不限課程狀態，皆可操作。

#### Scenario: 管理者可見刪除按鈕
- **WHEN** `admin` 或 `superadmin` 檢視任一課程詳情頁
- **THEN** 頁面底部管理操作區塊顯示「刪除課程」按鈕

#### Scenario: 一般講師不可見刪除按鈕
- **WHEN** 不具 `admin`／`superadmin` 身分的講師（含該課建立者）檢視課程詳情頁
- **THEN** 頁面不顯示刪除按鈕

#### Scenario: 開啟刪除確認 Dialog 並顯示影響範圍
- **WHEN** 管理者點擊「刪除課程」按鈕
- **THEN** 系統彈出確認 Dialog，標題為「確認刪除課程」，內容明確列出該課程目前的報名人數與已結業人數，並提示刪除為不可回復操作

#### Scenario: 無報名資料的課程可直接刪除
- **WHEN** 管理者對報名人數為 0 的課程點擊刪除並確認
- **THEN** Dialog 顯示「目前無報名資料」，確認後系統直接執行刪除

#### Scenario: 點擊取消關閉 Dialog
- **WHEN** 管理者點擊 Dialog 中的「取消」或關閉按鈕
- **THEN** Dialog 關閉，課程不受影響

### Requirement: 執行刪除課程
確認送出後，系統 SHALL 於單一交易內：刪除該課程全部 `InviteEnrollment`（含關聯的 `MaterialShipmentItem` 指派），再刪除該 `CourseInvite`。與此課程關聯的 `AdminActionLog`／`SupportInquiry`／`LearningRecordFeedback` 紀錄本身 SHALL 保留（其課程關聯欄位依既有 FK 設定改為 null，文字快照不受影響），`CourseMessage` SHALL 隨課程一併刪除。刪除成功後 SHALL 導向開課管理清單頁。Server Action 的守衛 SHALL 為 `canAccessAdmin`。

#### Scenario: 刪除成功導向清單頁
- **WHEN** 管理者確認刪除課程
- **THEN** 系統於交易內移除該課程與其報名／教材指派／留言等關聯資料，顯示「課程已刪除」toast，導向開課管理清單頁，原課程不再存在

#### Scenario: 關聯紀錄以快照保留
- **WHEN** 一筆課程被刪除，且該課程曾有 `AdminActionLog`／`SupportInquiry` 紀錄關聯
- **THEN** 這些紀錄本身不被刪除，其課程關聯欄位變更為 null，紀錄仍可透過既有文字快照欄位（如 `inviteTitle`）呈現原始資訊

#### Scenario: 刪除失敗（伺服器錯誤）
- **WHEN** Server Action 回傳錯誤
- **THEN** 顯示「刪除失敗，請稍後再試」toast，Dialog 維持開啟，課程資料不變

#### Scenario: 無權限者無法刪除
- **WHEN** 非 `admin`／`superadmin` 身分呼叫刪除 Server Action
- **THEN** 回傳無權限錯誤，課程資料不變

### Requirement: 開課管理清單封存篩選
開課管理清單頁狀態篩選 SHALL 新增「已封存」選項。選擇「已封存」以外的任何篩選（含未指定篩選、以及「招生中」「進行中」「已結業」「已取消」）時，清單查詢 SHALL 排除 `archivedAt` 不為 null 的課程；僅選擇「已封存」篩選時 SHALL 僅顯示 `archivedAt` 不為 null 的課程。

#### Scenario: 預設清單不顯示已封存課程
- **WHEN** 管理者開啟開課管理清單頁，未套用任何狀態篩選
- **THEN** 清單不顯示任何已封存的課程

#### Scenario: 選擇已封存篩選可調出封存課程
- **WHEN** 管理者於狀態篩選選擇「已封存」
- **THEN** 清單僅顯示 `archivedAt` 不為 null 的課程

#### Scenario: 其他狀態篩選同樣排除已封存課程
- **WHEN** 管理者選擇「招生中」「進行中」「已結業」或「已取消」等既有狀態篩選
- **THEN** 篩選結果不包含任何已封存的課程，即使該課程原本狀態符合篩選條件

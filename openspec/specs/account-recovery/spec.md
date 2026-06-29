# account-recovery Specification

## Purpose
TBD - created by archiving change cr-spec-260629-002. Update Purpose after archive.
## Requirements
### Requirement: 找回帳號入口
首頁（`/`）與登入頁（`/login`）SHALL 提供「找回帳號」入口，導向公開頁 `/recover-account`，供未登入訪客使用。

#### Scenario: 首頁顯示找回帳號入口
- **WHEN** 未登入訪客開啟首頁
- **THEN** 頁面顯示「找回帳號」連結／按鈕，點擊導向 `/recover-account`

#### Scenario: 登入頁顯示找回帳號入口
- **WHEN** 訪客開啟 `/login`
- **THEN** 頁面顯示「找回帳號」連結，點擊導向 `/recover-account`

### Requirement: 以中文名字查詢未啟用帳號
找回帳號頁 SHALL 要求輸入中文名字（`realName`），並僅在**未啟用帳號**（`lastLoginAt` 為 null 且 `isTempPassword` 為 true）範圍內以 `realName`（去除前後空白後）精確比對。中文名字僅用於此查詢，不改變登入認證方式。

#### Scenario: 查到唯一未啟用帳號
- **WHEN** 訪客輸入的中文名字在未啟用帳號中恰好對應一筆
- **THEN** 進入「身分驗證選擇題」步驟

#### Scenario: 查無資料不揭露
- **WHEN** 輸入的中文名字在未啟用帳號中查無對應
- **THEN** 顯示通用訊息「查無符合資料，請洽管理員」，不揭露帳號是否存在

#### Scenario: 多筆同名拒絕並導向管理員
- **WHEN** 輸入的中文名字在未啟用帳號中對應多筆
- **THEN** 顯示「查到多筆同名，請洽管理員」並中止流程，不揭露帳號細節

#### Scenario: 已啟用帳號不在查詢範圍
- **WHEN** 中文名字對應的帳號 `lastLoginAt` 非 null 或 `isTempPassword` 為 false（已登入過/已自設密碼）
- **THEN** 該帳號不被視為可找回，視同查無資料，並提示可改用「忘記密碼」

### Requirement: 身分驗證選擇題
查到唯一未啟用帳號後，系統 SHALL 以該帳號的課程資料出一題選擇題驗證身分，答對才可進入「確認/修改 email」步驟。題目正解 SHALL 取自該帳號的 `InviteEnrollment`——授課老師為其報名課程的 `CourseInvite.createdBy`，或同學為同班其他報名者；誘答選項 SHALL 取自與該帳號課程無關的其他會員，全部以顯示名稱（`getMemberDisplayName`）呈現。系統 SHALL 限制嘗試次數（預設 3 次）。

#### Scenario: 答對通過驗證
- **WHEN** 訪客在選擇題中選出正確的老師或同學
- **THEN** 通過身分驗證，進入「確認/修改 email」步驟

#### Scenario: 答錯且未超過次數
- **WHEN** 訪客選錯且尚未達嘗試次數上限
- **THEN** 顯示答錯提示並可再次作答（嘗試次數累加）

#### Scenario: 超過嘗試次數上限
- **WHEN** 訪客答錯次數達到上限
- **THEN** 中止找回流程並顯示「請洽管理員」，不進入 email 步驟

#### Scenario: 無足夠課程資料可出題
- **WHEN** 該帳號無報名紀錄或無法湊出有效選項
- **THEN** 不出題，顯示「請洽管理員」並中止流程

### Requirement: 確認或修改 email
通過身分驗證後，頁面 SHALL 顯示目前帳號 email 供**確認或修改**。修改 email 時 SHALL 驗證 email 格式，且若與原值不同 SHALL 檢查未被其他帳號使用。

#### Scenario: email 格式錯誤
- **WHEN** 訪客輸入格式不正確的 email 並送出
- **THEN** 顯示 email 格式錯誤，不進行後續更新

#### Scenario: 新 email 已被其他帳號使用
- **WHEN** 訪客將 email 改為已被其他帳號使用的位址
- **THEN** 顯示「此 Email 已被使用」，不進行更新

#### Scenario: 確認 email 不修改
- **WHEN** 訪客未變更 email 直接確認送出
- **THEN** 以原 email 繼續重寄臨時密碼流程

### Requirement: 重寄臨時密碼並引導登入
送出確認/修改後，系統 SHALL 於單一交易內更新帳號 email、重新產生臨時密碼（`isTempPassword` 維持 true）並更新白名單，交易成功後寄送臨時密碼信至確認後的 email，並引導訪客至登入頁以 email + 臨時密碼登入。

#### Scenario: 成功重寄臨時密碼
- **WHEN** 訪客通過 email 驗證並送出
- **THEN** 系統更新 email、重產臨時密碼、白名單以該 email 設為可登入，並寄出臨時密碼信至該 email

#### Scenario: 引導前往登入
- **WHEN** 重寄臨時密碼成功
- **THEN** 頁面顯示成功訊息（臨時密碼已寄至該 email）並提供前往 `/login` 的連結

#### Scenario: email 唯一性衝突時不送出
- **WHEN** 送出時 email 被占用或格式錯誤
- **THEN** 不更新任何資料、不寄信，並顯示對應錯誤


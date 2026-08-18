# admin-enrollment-management Delta（cr-spec-260818-003）

## MODIFIED Requirements

### Requirement: 移除學員

**管理者或該課講師** SHALL 能自班級移除學員（實體刪除該筆 `InviteEnrollment`），移除時 SHALL 填寫**必填**移除原因；未填寫（含僅空白字元）時系統 SHALL 拒絕並回傳欄位錯誤，UI 於原因欄位為空時 SHALL 停用「確認移除」按鈕。**該報名是否有教材寄送項目（`MaterialShipmentItem`）關聯 SHALL NOT 影響是否能移除**——有教材寄送紀錄的報名一樣可以被移除；`MaterialShipmentItem.enrollmentId` 依既有 FK（`ON DELETE SET NULL`）於報名刪除時自動清空關聯，寄送紀錄本身不受影響、不會被刪除。移除已結業報名時，UI SHALL 先以醒目確認對話框警示影響（證書待製作、師生階層、擋修資格），操作者確認後方執行。刪除與操作紀錄寫入 SHALL 於單一交易內完成，操作紀錄（`AdminActionLog.detail`）SHALL 包含操作者填寫之移除原因。系統 SHALL NOT 主動刪除既有 `CertificateProduction` 紀錄。查詢報名資料、操作者資訊等資料庫讀取步驟若拋出例外，SHALL 被攔截並回傳受控錯誤訊息，不得使前端出現未受控的錯誤畫面。

#### Scenario: 移除一般報名
- **WHEN** 管理者或該課講師填寫移除原因後，移除某未結業、無教材寄送關聯的報名
- **THEN** 該筆報名被刪除，學員自該班清單消失，`AdminActionLog.detail` 包含填寫的原因

#### Scenario: 未填寫原因擋下
- **WHEN** 操作者未填寫移除原因（或僅輸入空白字元）即嘗試送出
- **THEN** UI「確認移除」按鈕為停用狀態；若仍以其他方式呼叫 Server Action，系統回傳欄位錯誤，不刪除任何資料

#### Scenario: 有教材寄送關聯仍可移除
- **WHEN** 管理者或該課講師填寫移除原因後，移除已有教材寄送項目的報名
- **THEN** 該筆報名被刪除，對應 `MaterialShipmentItem` 的 `enrollmentId` 被設為 null（寄送紀錄本身保留），管理者群組收到的通知內容註明該學員曾有教材寄送紀錄

#### Scenario: 移除已結業報名需確認
- **WHEN** 操作者點選移除已結業的報名
- **THEN** 先顯示影響警示之確認對話框，填寫原因並確認後才刪除

#### Scenario: 無權限者無法移除
- **WHEN** 非管理者且非該課建立者呼叫移除學員 Server Action
- **THEN** 回傳 `{ success: false, message: '無權限' }`

#### Scenario: 資料庫查詢例外不再造成錯誤畫面
- **WHEN** 移除流程中的報名資料查詢或操作者資訊查詢因例外（如連線瞬斷）失敗
- **THEN** 系統攔截例外並回傳受控錯誤訊息（如「移除失敗，請稍後再試」），前端顯示 toast，不出現未受控的應用程式錯誤畫面

## ADDED Requirements

### Requirement: 移除成功通知管理者群組

移除學員成功後，系統 SHALL 以不阻塞主操作結果的方式（fire-and-forget，失敗僅記錄於伺服器日誌，不影響移除本身已成功回傳的結果），查詢所有具 `admin` 或 `superadmin` 身分的使用者，逐一寫入站內通知（沿用既有 `createNotification`），通知內容 SHALL 包含班級名稱、被移除學員姓名、操作者姓名、移除原因；若該報名於移除當下已有教材寄送紀錄，通知內容 SHALL 額外註明，提醒管理者留意後續教材處理。

#### Scenario: 移除成功後通知全體管理者
- **WHEN** 管理者或該課講師成功移除一筆報名
- **THEN** 系統對所有 `admin`／`superadmin` 身分使用者各寫入一筆站內通知，內容含班級名稱、被移除學員姓名、操作者姓名、移除原因

#### Scenario: 有教材寄送紀錄時通知額外註明
- **WHEN** 被移除的報名於移除當下已有教材寄送項目
- **THEN** 管理者群組收到的通知內容額外包含教材寄送提醒文字

#### Scenario: 通知寫入失敗不影響移除結果
- **WHEN** 通知寫入過程發生例外（如 DB 連線失敗）
- **THEN** 例外被攔截並記錄於伺服器日誌，移除操作本身仍回傳成功、前端仍顯示「已移除學員」

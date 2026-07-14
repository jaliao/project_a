# account-email-change Delta（cr-spec-260714-006）

## ADDED Requirements

### Requirement: 帳號 Email 變更共通規則

變更登入帳號 email（本人或管理者）時，系統 SHALL：①正規化（trim＋小寫）並驗證格式；②檢查唯一性（已被其他帳號使用或與現值相同時回欄位錯誤、不變更）；③於單一交易內完成——更新 `User.email`、停用舊 email 白名單（`isActive=false`，查無列則略過）、新 email 白名單 upsert（`isActive=true`）。變更 SHALL NOT 影響 `commEmail`（通訊信箱）、Google 綁定關係（`Account`）與任何課程／報名資料，SHALL NOT 寄送信件或 Inbox 通知。變更後既有登入 session SHALL 繼續有效，下次登入以新 email 為準（session 之 email 欄位 SHALL 於後續請求自 DB 同步）。

#### Scenario: 成功變更
- **WHEN** 變更請求通過驗證與唯一性檢查
- **THEN** 交易內更新 `User.email`、停用舊 email 白名單、新 email 白名單生效；通訊信箱、Google 綁定與課程資料不變

#### Scenario: email 已被使用
- **WHEN** 新 email 已為其他帳號的登入 email
- **THEN** 回欄位錯誤「此 Email 已被使用」，不變更任何資料

#### Scenario: 與目前帳號相同
- **WHEN** 新 email 與目前登入 email 相同（不分大小寫）
- **THEN** 回欄位錯誤，不執行變更

#### Scenario: 變更後登入
- **WHEN** 變更成功後會員登出再登入
- **THEN** 以新 email（＋原密碼）可登入；舊 email 無法再登入

### Requirement: 本人帳號修改（個人資料頁）

個人資料頁 SHALL 於「變更密碼」卡**上方**提供「帳號修改」卡（僅具密碼者）：輸入**新 email 與目前密碼**，經確認視窗（並列新舊 email、提醒下次登入用新帳號）後生效。Server Action SHALL 驗證 session 本人、以 bcrypt 核對目前密碼（錯誤回欄位錯誤）。**Google-only 使用者（`passwordHash` 為 null）** SHALL NOT 開放自改：同位置 SHALL 顯示「請洽管理員協助修改」說明卡，且 Server Action SHALL 拒絕其請求。

#### Scenario: 本人成功修改
- **WHEN** 具密碼的會員輸入新 email 與正確密碼並於確認視窗確認
- **THEN** 帳號 email 依共通規則變更，顯示成功提示（含下次登入用新帳號）

#### Scenario: 密碼錯誤
- **WHEN** 會員輸入的目前密碼不正確
- **THEN** 回欄位錯誤「密碼不正確」，不變更

#### Scenario: Google-only 使用者
- **WHEN** 無密碼（僅 Google 登入）的會員檢視個人資料頁
- **THEN** 帳號修改位置顯示「請洽管理員協助修改」說明，無輸入表單
- **AND** 其直接呼叫 Server Action 時被拒絕

### Requirement: 啟動帳號資訊顯示

個人資料頁 SHALL 於「啟動事工編號」下方（同卡）顯示「啟動帳號資訊」：目前登入帳號 email 與登入方式標示（「密碼登入」依 `passwordHash`、「Google 登入」依綁定紀錄，可並存），唯讀。

#### Scenario: 顯示帳號資訊
- **WHEN** 會員開啟個人資料頁
- **THEN** 啟動事工編號下方顯示其登入 email 與登入方式標示

#### Scenario: 變更後即時反映
- **WHEN** 會員完成帳號修改後頁面重新整理
- **THEN** 啟動帳號資訊顯示新 email

### Requirement: 管理者變更會員帳號

管理者（`canAccessAdmin`）SHALL 能變更任一會員的登入 email（含 Google-only 會員），免密碼確認，行為依共通規則。非管理者呼叫 SHALL 拒絕。

#### Scenario: 管理者代改
- **WHEN** 管理者輸入新 email 並確認
- **THEN** 該會員帳號 email 依共通規則變更

#### Scenario: 管理者代改 Google-only 會員
- **WHEN** 管理者對無密碼會員執行帳號修改
- **THEN** 變更成功（不受 Google-only 限制）

#### Scenario: 非管理者無法呼叫
- **WHEN** 不具 `canAccessAdmin` 者呼叫管理者變更 Server Action
- **THEN** 回傳 `{ success: false, message: '無權限' }`

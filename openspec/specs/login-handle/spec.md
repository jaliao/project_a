# login-handle Specification

## Purpose
TBD - created by archiving change cr-feat-261021-004. Update Purpose after archive.

## Requirements

### Requirement: 帳號代碼全站唯一且格式受限

`User.loginHandle` SHALL 為全站唯一、小寫正規化儲存且 NOT NULL 的字串，格式 SHALL 符合 `^[a-z0-9][a-z0-9._-]{2,18}[a-z0-9]$`（總長度 4–20 字元，首尾為英數字，中間可含 `.`／`_`／`-`，不可連續或以符號開頭結尾）。

#### Scenario: 格式正確且未被使用

- **WHEN** 使用者設定 `loginHandle` 為 `justin88`（符合格式、全站未被使用）
- **THEN** 系統接受並寫入（正規化為小寫）

#### Scenario: 格式不符

- **WHEN** 使用者輸入的 `loginHandle` 不符合上述格式（例如長度不足 4、以符號開頭、含大寫以外的非法字元）
- **THEN** 系統拒絕並回傳格式錯誤，不寫入

#### Scenario: 已被其他帳號使用

- **WHEN** 使用者輸入的 `loginHandle`（正規化後）已被其他 `User` 使用
- **THEN** 系統拒絕並回傳「此帳號代碼已被使用」，不寫入

### Requirement: 既有會員自動 backfill 帳號代碼

系統 SHALL 為所有既有會員（`loginHandle` 為空者）自動產生預設帳號代碼，衍生規則為 `spiritId` 轉小寫（`spiritId` 為空者以使用者 `id` 衍生防呆），不需使用者任何操作。Backfill 完成後，`loginHandle` SHALL 為 `NOT NULL` 且全站唯一。

#### Scenario: 既有會員自動取得預設帳號代碼

- **WHEN** 某既有會員 `spiritId` 為 `PA260001`，backfill 執行前 `loginHandle` 為空
- **THEN** backfill 後該會員 `loginHandle` 為 `pa260001`

#### Scenario: Backfill 不影響既有登入方式

- **WHEN** 某既有會員已能以 email＋密碼登入
- **THEN** backfill 後該會員仍可用原 email＋密碼登入，同時新增可用帳號代碼＋密碼登入

### Requirement: 帳號代碼可作為 Credentials 登入識別

系統的 Credentials 登入 SHALL 接受 email 或帳號代碼任一作為識別鍵查詢帳號，查詢時 SHALL 對輸入值正規化（trim、轉小寫）後比對。

#### Scenario: 以帳號代碼登入

- **WHEN** 使用者於登入頁輸入已設定的帳號代碼與正確密碼
- **THEN** 系統查得對應帳號並驗證密碼成功，正常登入

#### Scenario: 以 email 登入（既有行為不變）

- **WHEN** 使用者於登入頁輸入 email 與正確密碼
- **THEN** 系統查得對應帳號並驗證密碼成功，正常登入，行為與變更前一致

#### Scenario: 識別鍵查無帳號或密碼錯誤

- **WHEN** 使用者輸入的 email／帳號代碼查無對應帳號，或密碼不正確
- **THEN** 系統拒絕登入，不透露是識別鍵不存在或密碼錯誤

### Requirement: 帳號代碼可自行修改且有改名冷卻

已登入使用者 SHALL 可修改自己的帳號代碼，新值需符合格式與唯一性規則；修改後系統 SHALL 記錄修改時間於 `handleChangedAt`，並限制同一帳號 30 天內僅能修改一次。首次 backfill 產生的預設值不計入此限制。

#### Scenario: 首次手動修改不受冷卻限制

- **WHEN** 使用者的 `handleChangedAt` 為 `null`（尚未手動修改過，可能是 backfill 預設值或全新 LINE 帳號衍生值），提出修改且新值合法
- **THEN** 系統允許修改，並將 `handleChangedAt` 設為目前時間

#### Scenario: 冷卻期內再次修改被拒絕

- **WHEN** 使用者的 `handleChangedAt` 距今不足 30 天，再次提出修改
- **THEN** 系統拒絕並提示距下次可修改的剩餘天數，不寫入

#### Scenario: 冷卻期外再次修改成功

- **WHEN** 使用者的 `handleChangedAt` 距今已超過 30 天，提出合法的新值
- **THEN** 系統允許修改，並將 `handleChangedAt` 更新為目前時間

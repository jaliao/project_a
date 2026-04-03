## ADDED Requirements

### Requirement: 會員個人資料所屬教會欄位
個人資料頁（`/profile`）SHALL 提供「所屬教會/單位」欄位，讓會員選擇所屬教會。選項包含：系統清單中的教會（`isActive = true`）、「其他」（可自填文字）、「無」。選擇結果儲存於 `User.churchType`、`User.churchId`（選清單時）、`User.churchOther`（選其他時）。

#### Scenario: 顯示教會下拉清單
- **WHEN** 會員進入 `/profile`
- **THEN** 所屬教會欄位顯示下拉選單，選項包含「無」、所有 `isActive = true` 的教會（依 sortOrder）、以及「其他」

#### Scenario: 選擇清單中的教會
- **WHEN** 會員選擇清單中某教會並儲存
- **THEN** `churchType = 'church'`，`churchId` 設為對應教會 id，`churchOther` 清空

#### Scenario: 選擇「其他」並填寫文字
- **WHEN** 會員選擇「其他」，輸入自訂教會名稱並儲存
- **THEN** `churchType = 'other'`，`churchOther` 儲存輸入文字，`churchId` 清空

#### Scenario: 選擇「其他」但未填文字
- **WHEN** 會員選擇「其他」但文字欄位為空，嘗試儲存
- **THEN** 顯示驗證錯誤「請填寫教會/單位名稱」，不儲存

#### Scenario: 選擇「無」
- **WHEN** 會員選擇「無」並儲存
- **THEN** `churchType = 'none'`，`churchId` 和 `churchOther` 均清空

#### Scenario: 顯示現有關聯教會（已停用）
- **WHEN** 會員目前關聯的教會已被停用，進入個人資料頁
- **THEN** 下拉清單中顯示該停用教會並標記「（已停用）」，讓會員知道可以更換選擇

#### Scenario: 未曾填寫教會
- **WHEN** 會員從未設定所屬教會
- **THEN** 下拉選單預設顯示「無」

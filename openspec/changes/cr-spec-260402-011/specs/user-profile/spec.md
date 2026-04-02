## ADDED Requirements

### Requirement: 個人資料英文名稱、性別與顯示名稱欄位
個人資料頁（`/profile`）基本資料區塊 SHALL 新增三個欄位：
- **英文名稱**（`englishName`）：文字輸入，選填
- **性別**（`gender`）：下拉選單，選項為「未設定」、「男」、「女」
- **顯示名稱偏好**（`displayNameMode`）：下拉選單，選項為「匿名（中文名稱）」、「匿名（英文名稱）」，顯示選擇後對應的預覽名稱

#### Scenario: 顯示現有資料
- **WHEN** 會員進入個人資料頁
- **THEN** 英文名稱、性別、顯示名稱偏好欄位顯示現有儲存值（未填者顯示預設/空白）

#### Scenario: 儲存英文名稱
- **WHEN** 會員填寫英文名稱並儲存
- **THEN** `User.englishName` 更新，顯示成功訊息

#### Scenario: 儲存性別
- **WHEN** 會員選擇性別並儲存
- **THEN** `User.gender` 更新

#### Scenario: 儲存顯示名稱偏好
- **WHEN** 會員選擇「匿名（英文名稱）」並儲存
- **THEN** `User.displayNameMode = 'english'`；系統各處依此模式顯示該會員名稱

#### Scenario: 顯示名稱預覽
- **WHEN** 會員變更顯示名稱偏好選項（尚未儲存）
- **THEN** 欄位旁即時顯示預覽名稱（根據當前表單資料計算）

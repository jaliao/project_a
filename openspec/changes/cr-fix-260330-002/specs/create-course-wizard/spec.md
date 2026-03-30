## MODIFIED Requirements

### Requirement: Step 1 — 卡片式課程選擇
精靈第一步 SHALL 以卡片形式展示所有 `isActive: true` 的課程。有資格開設的卡片可點擊選取；無資格的卡片以灰暗樣式顯示且不可點擊。選中狀態以視覺樣式（border/ring）區分。

**授課資格定義**：使用者須已結業該課程本身（即 `graduatedCatalogIds` 包含 `course.id`），才具備授課資格。`admin` / `superadmin` 不受此限制。

#### Scenario: 顯示所有開放課程卡片
- **WHEN** 使用者進入精靈 Step 1
- **THEN** 頁面顯示所有 `isActive: true` 的課程卡片（無論是否有資格）

#### Scenario: 有資格的課程卡片可點擊
- **WHEN** 使用者已結業靈人啟動 1，點擊「靈人啟動 1」卡片
- **THEN** 卡片呈現選中樣式（border/ring），「下一步」按鈕變為可點擊

#### Scenario: 結業靈人啟動 2 才能授課靈人啟動 2
- **WHEN** 使用者已結業靈人啟動 2，點擊「靈人啟動 2」卡片
- **THEN** 卡片呈現選中樣式，「下一步」按鈕變為可點擊

#### Scenario: 僅結業靈人啟動 1 不可授課靈人啟動 2
- **WHEN** 使用者已結業靈人啟動 1 但尚未結業靈人啟動 2，點擊「靈人啟動 2」卡片
- **THEN** 卡片不響應點擊，維持灰暗不可選取狀態，顯示「須先完成啟動靈人 2 才能授課」提示文字

#### Scenario: 無資格的課程卡片不可點擊
- **WHEN** 使用者未結業某課程，點擊該課程卡片
- **THEN** 卡片不響應點擊，維持灰暗不可選取狀態，顯示「須先完成{課程名稱}才能授課」提示文字

#### Scenario: 未選課程不可進入下一步
- **WHEN** 使用者未點擊任何課程卡片
- **THEN** 「下一步」按鈕保持 disabled

#### Scenario: admin 可點擊所有課程卡片
- **WHEN** role 為 `admin` 或 `superadmin` 的使用者進入 Step 1
- **THEN** 所有開放課程卡片均可點擊，無資格限制

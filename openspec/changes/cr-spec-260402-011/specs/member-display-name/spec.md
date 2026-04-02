## ADDED Requirements

### Requirement: 顯示名稱 Helper 函式
系統 SHALL 提供 `getMemberDisplayName(user)` 純函式，統一全站會員名稱顯示邏輯。函式接收含 `realName`、`nickname`、`englishName`、`name`、`displayNameMode` 的物件，回傳格式化後的顯示字串。

顯示規則：
- `displayNameMode = 'english'`：匿名名稱 = `englishName ?? name ?? realName`
- `displayNameMode = 'chinese'`（預設）：匿名名稱 = `nickname ?? realName ?? name`
- 若匿名名稱與 `realName` 相同：回傳 `realName`（不加括號）
- 若匿名名稱與 `realName` 不同且兩者皆有值：回傳 `{匿名名稱}（{realName}）`
- 若僅有匿名名稱（無 `realName`）：回傳匿名名稱
- 若兩者皆無值：回傳 `'（未填）'`

#### Scenario: 中文模式，nickname 與 realName 相同
- **WHEN** `displayNameMode = 'chinese'`，`nickname = '黃國倫'`，`realName = '黃國倫'`
- **THEN** 回傳 `'黃國倫'`（不加括號）

#### Scenario: 中文模式，nickname 與 realName 不同
- **WHEN** `displayNameMode = 'chinese'`，`nickname = 'Gorden'`，`realName = '黃國倫'`
- **THEN** 回傳 `'Gorden（黃國倫）'`

#### Scenario: 英文模式，englishName 與 realName 相同
- **WHEN** `displayNameMode = 'english'`，`englishName = 'Hilo'`，`realName = 'Hilo'`（或 `realName = null`）
- **THEN** 回傳 `'Hilo'`（不加括號）

#### Scenario: 英文模式，有英文名也有中文名
- **WHEN** `displayNameMode = 'english'`，`englishName = 'Romen'`，`realName = '吳容銘'`
- **THEN** 回傳 `'Romen（吳容銘）'`

#### Scenario: 無任何名稱資料
- **WHEN** `realName = null`，`nickname = null`，`englishName = null`，`name = null`
- **THEN** 回傳 `'（未填）'`

### Requirement: 顯示名稱元件
系統 SHALL 提供 `<MemberDisplayName>` React 元件，接收與 helper 相同的 user props，渲染顯示名稱文字。元件可用於 Server Component 與 Client Component 環境。

#### Scenario: 渲染顯示名稱
- **WHEN** `<MemberDisplayName>` 接收有效 user 資料
- **THEN** 渲染與 `getMemberDisplayName()` 相同的文字結果

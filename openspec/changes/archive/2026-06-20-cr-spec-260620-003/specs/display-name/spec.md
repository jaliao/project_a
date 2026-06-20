## ADDED Requirements

### Requirement: 顯示名稱規則
系統 SHALL 提供單一「顯示名稱」規則：以**暱稱**（`nickname`）為基底，未填則退回**中文名稱**（`realName`），再未填則退回**英文名稱**（`englishName`）；三者皆無則顯示「（未填）」。此退回鏈 SHALL NOT 包含 `email`（Email 不作為名稱）。規則 SHALL 集中於 `lib/utils/member-display.ts` 的 `getMemberDisplayName`，為唯一邏輯出口。

#### Scenario: 有暱稱
- **WHEN** 使用者 `nickname` = 「小明」
- **THEN** 顯示名稱基底為「小明」

#### Scenario: 無暱稱退回中文名稱
- **WHEN** 使用者 `nickname` 為空、`realName` = 「王小明」
- **THEN** 顯示名稱基底為「王小明」

#### Scenario: 無暱稱無中文名稱退回英文名稱
- **WHEN** 使用者 `nickname`、`realName` 皆為空、`englishName` = 「Ming」
- **THEN** 顯示名稱基底為「Ming」

#### Scenario: 全部未填
- **WHEN** 使用者 `nickname`、`realName`、`englishName` 皆為空
- **THEN** 顯示名稱為「（未填）」，且不以 Email 充當名稱

### Requirement: 顯示名稱三種模式
系統 SHALL 以 `DisplayNameMode` 提供三種顯示模式，預設為「暱稱」：
- `nickname`（暱稱）：僅顯示名稱基底
- `nickname_zh`（暱稱（中文名稱））：`{基底}（{realName}）`
- `nickname_en`（暱稱（英文名稱））：`{基底}（{englishName}）`

括號內名稱若為空、或與基底相同，SHALL 省略括號（僅顯示基底）。

#### Scenario: 預設暱稱模式
- **WHEN** 使用者 `displayNameMode` 為 `nickname`，暱稱=「小明」
- **THEN** 顯示「小明」

#### Scenario: 暱稱（中文名稱）模式
- **WHEN** `displayNameMode` = `nickname_zh`，暱稱=「小明」、`realName`=「王小明」
- **THEN** 顯示「小明（王小明）」

#### Scenario: 暱稱（英文名稱）模式
- **WHEN** `displayNameMode` = `nickname_en`，暱稱=「小明」、`englishName`=「Ming」
- **THEN** 顯示「小明（Ming）」

#### Scenario: 括號名稱與基底相同則省略
- **WHEN** `displayNameMode` = `nickname_zh`，暱稱為空、`realName`=「王小明」（基底退回為 realName）
- **THEN** 顯示「王小明」（不顯示「王小明（王小明）」）

#### Scenario: 括號名稱為空則省略
- **WHEN** `displayNameMode` = `nickname_en`，暱稱=「小明」、`englishName` 為空
- **THEN** 顯示「小明」

### Requirement: 標準顯示名稱元件
系統 SHALL 提供標準元件 `MemberDisplayName`（`components/member/member-display-name.tsx`）封裝 `getMemberDisplayName`，接受 `nickname`／`realName`／`englishName`／`displayNameMode` 等欄位並輸出顯示名稱。介面顯示人名 SHALL 透過此元件或 `getMemberDisplayName`，不得自行拼接名稱欄位。

#### Scenario: 元件輸出顯示名稱
- **WHEN** 以使用者名稱欄位渲染 `<MemberDisplayName />`
- **THEN** 輸出依「顯示名稱規則」與其 `displayNameMode` 計算之名稱

### Requirement: 介面人名一律使用顯示名稱（系統標準）
基於資安/隱私，系統**所有**呈現人名的介面位置 SHALL 使用顯示名稱規則，且 SHALL NOT 直接以 `realName` 作為身分名稱顯示，亦 SHALL NOT 以 `email` 充當名稱（如既有 `name ?? email`、`realName ?? name` 等拼接皆須改用標準元件）。此約束涵蓋課程頁面、後台學員/會員頁面、清單、師生樹、課程留言等一切顯示人名之處。

#### Scenario: 課程頁面學員名稱
- **WHEN** 課程詳情頁顯示學員/老師名稱
- **THEN** 以顯示名稱規則呈現，不直接顯示 `realName`，不以 Email 充當名稱

#### Scenario: 後台學員/會員名稱
- **WHEN** 後台會員清單/詳情、師生樹顯示人名
- **THEN** 以顯示名稱規則呈現

#### Scenario: Email 作為聯繫資訊仍可顯示
- **WHEN** 介面需提供 Email 供課程聯繫
- **THEN** Email 可獨立顯示（非作為名稱），不受本約束限制

### Requirement: 顯示名稱方式選擇器使用「暱稱」用語
個人資料表單 SHALL 提供「顯示名稱方式」選擇器，提供三種模式選項，文案使用「暱稱」用語（非「匿名」）：暱稱／暱稱（中文名稱）／暱稱（英文名稱），預設「暱稱」。表單 SHALL 即時預覽顯示名稱。

#### Scenario: 選擇器三選項與用語
- **WHEN** 使用者開啟個人資料的「顯示名稱方式」選擇器
- **THEN** 顯示「暱稱」「暱稱（中文名稱）」「暱稱（英文名稱）」三選項，無「匿名」字樣

#### Scenario: 變更模式即時預覽
- **WHEN** 使用者切換顯示名稱方式
- **THEN** 預覽區即時依所選模式更新顯示名稱

#### Scenario: 未設定時預設暱稱
- **WHEN** 使用者未曾設定 `displayNameMode`
- **THEN** 以 `nickname`（暱稱）模式顯示

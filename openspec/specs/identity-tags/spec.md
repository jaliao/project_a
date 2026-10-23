# identity-tags Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for identity-tags.

## Requirements

### Requirement: 身分標籤計算邏輯
系統 SHALL 根據使用者的 `role`（含 `isProxyMember` 狀態）計算身分標籤陣列，可同時包含多個標籤；計算邏輯 SHALL 集中於單一函式 `getIdentityTags(roles, isProxyMember, t?)`，不得在各頁面重複實作。

#### Scenario: 系統管理員標籤
- **WHEN** 使用者 `role` 為 `admin` 或 `superadmin`
- **THEN** 標籤陣列包含「系統管理員」

#### Scenario: 一般使用者不顯示管理員標籤
- **WHEN** 使用者 `role` 為 `user`
- **THEN** 標籤陣列不包含「系統管理員」

### Requirement: 啟動靈人講師標籤
系統 SHALL 根據使用者的書籍講師身分（`teacher_1`～`teacher_3`）產生對應的「{書名}講師」標籤，可同時包含多個。書名對應依 member-roles 的「講師身分與書籍對應」：`teacher_1`→「啟動靈人講師」、`teacher_2`→「啟動豐盛講師」、`teacher_3`→「啟動得勝講師」。標籤 SHALL NOT 再以結業證書推導。

#### Scenario: 擁有啟動靈人講師身分
- **WHEN** 使用者身分集合含 `teacher_1`
- **THEN** 標籤陣列包含「啟動靈人講師」

#### Scenario: 擁有多個書籍講師身分
- **WHEN** 使用者身分集合含 `teacher_1` 與 `teacher_2`
- **THEN** 標籤陣列同時包含「啟動靈人講師」與「啟動豐盛講師」

#### Scenario: 無任何書籍講師身分
- **WHEN** 使用者身分集合不含任何 `teacher_1`～`teacher_3`
- **THEN** 標籤陣列不包含任何講師標籤

### Requirement: 未註冊學員標籤
系統 SHALL 根據使用者的 `isProxyMember` 欄位，於身分標籤陣列最前加入「未註冊學員」標籤；標籤樣式 SHALL 與其他身分標籤一致（不得使用專屬警示色或獨立元件呈現）。

#### Scenario: 代填（未註冊）學員顯示標籤
- **WHEN** 使用者 `isProxyMember` 為 `true`
- **THEN** 標籤陣列最前包含「未註冊學員」，呈現樣式與其他身分標籤相同

#### Scenario: 已完成註冊不顯示標籤
- **WHEN** 使用者 `isProxyMember` 為 `false`
- **THEN** 標籤陣列不包含「未註冊學員」

### Requirement: 一般會員基準標籤
當呼叫端提供完整 `roles` 資料時（非 `undefined`／`null`），系統 SHALL 在標籤陣列最後加入「一般會員」基準標籤，與其他身分標籤（未註冊學員、系統管理員、書籍講師）並存顯示，不互斥。當呼叫端未提供 `roles` 資料（僅查詢 `isProxyMember` 的情境，例如疑似重複帳號比對、選擇學員元件）時，系統 SHALL NOT 顯示「一般會員」基準標籤。

#### Scenario: 提供完整身分資料時恆顯示一般會員標籤
- **WHEN** 呼叫端提供使用者完整 `roles`（不論是否同時具備其他身分）
- **THEN** 標籤陣列最後包含「一般會員」

#### Scenario: 僅提供未註冊狀態時不顯示一般會員標籤
- **WHEN** 呼叫端僅傳入 `isProxyMember`、未提供 `roles`
- **THEN** 標籤陣列 SHALL NOT 包含「一般會員」，僅可能包含「未註冊學員」

### Requirement: 單一商業邏輯與單一渲染元件
所有顯示身分標籤的頁面與元件（個人首頁、後台會員列表、後台會員詳情頁、疑似重複帳號比對卡片、選擇學員元件）SHALL 呼叫同一個計算函式 `getIdentityTags()` 取得標籤陣列，並透過同一個共用元件 `IdentityTagBadges` 渲染，不得各自手刻 Badge 樣式或重複實作判斷邏輯。

#### Scenario: 不同頁面顯示結果一致
- **WHEN** 同一位 `isProxyMember = true` 且具備 `teacher_1` 身分的使用者，分別在個人首頁與後台會員詳情頁被檢視
- **THEN** 兩處顯示的標籤文字與樣式完全一致（皆為「未註冊學員」「啟動靈人講師」「一般會員」，`variant="secondary"`）

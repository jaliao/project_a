## ADDED Requirements

### Requirement: 會員詳情頁活躍度指標
會員詳情頁基本資料分頁 SHALL 顯示三個獨立的活躍度指標：
- **最後登入時間**（`lastLoginAt`）與**上次登入時間**（`previousLoginAt`）：有值時格式化顯示，無值時顯示「—」。
- **是否完成首次登入**：依 `lastLoginAt` 是否為 null 判定（非 null → 「已完成」；null → 「尚未登入」）。
- **是否完成首次補填基本資料**：依 `realName` 與 `phone` 是否皆已填寫判定（皆有 → 「已補填」；任一缺 → 「尚未補填」）。
- **是否已更改臨時密碼**：依 `passwordHash` 與 `isTempPassword` 判定：`passwordHash` 為 null → 「不適用」；`passwordHash` 非 null 且 `isTempPassword` 為 true → 「尚未更改」；`passwordHash` 非 null 且 `isTempPassword` 為 false → 「已更改」。

這三個指標 SHALL 各自獨立呈現，不以其中一項代替另一項。

#### Scenario: 顯示最後登入與上次登入時間
- **WHEN** 管理者開啟一位已登入兩次以上會員的詳情頁
- **THEN** 基本資料分頁顯示其「最後登入時間」與「上次登入時間」

#### Scenario: 從未登入者顯示尚未登入
- **WHEN** 管理者開啟一位 `lastLoginAt` 為 null 的會員詳情頁
- **THEN** 「是否完成首次登入」顯示「尚未登入」，且最後登入／上次登入時間皆顯示「—」

#### Scenario: 已補填基本資料
- **WHEN** 管理者開啟一位 `realName` 與 `phone` 皆有值的會員詳情頁
- **THEN** 「是否完成首次補填基本資料」顯示「已補填」

#### Scenario: 尚未補填基本資料
- **WHEN** 管理者開啟一位 `realName` 或 `phone` 任一缺失的會員詳情頁
- **THEN** 「是否完成首次補填基本資料」顯示「尚未補填」

#### Scenario: 已更改臨時密碼
- **WHEN** 管理者開啟一位 `passwordHash` 非 null 且 `isTempPassword` 為 false 的會員詳情頁
- **THEN** 「是否已更改臨時密碼」顯示「已更改」

#### Scenario: 尚未更改臨時密碼
- **WHEN** 管理者開啟一位 `passwordHash` 非 null 且 `isTempPassword` 為 true 的會員詳情頁
- **THEN** 「是否已更改臨時密碼」顯示「尚未更改」

#### Scenario: 無密碼帳號顯示不適用
- **WHEN** 管理者開啟一位 `passwordHash` 為 null（純 Google 帳號）的會員詳情頁
- **THEN** 「是否已更改臨時密碼」顯示「不適用」

---

### Requirement: 會員匯出活躍度欄位
會員 Excel 匯出 SHALL 新增「上次登入」「已完成首次登入」「已完成首次補填」「已更改臨時密碼」欄位（既有「最後登入」欄保留）。各欄判定規則與詳情頁活躍度指標一致。

#### Scenario: 匯出含活躍度欄位
- **WHEN** 管理者匯出會員 Excel
- **THEN** 檔案包含「最後登入」「上次登入」「已完成首次登入」「已完成首次補填」「已更改臨時密碼」欄位

#### Scenario: 匯出值與詳情頁判定一致
- **WHEN** 匯出某 `passwordHash` 為 null 的會員
- **THEN** 其「已更改臨時密碼」欄顯示「不適用」，「已完成首次登入」「已完成首次補填」依各自規則填入

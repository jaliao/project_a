## ADDED Requirements

### Requirement: 結業資訊呈現老師整體回饋
課程詳情的結業資訊區塊（沿用既有 `canViewGraduation`：管理者與課程老師可見）SHALL 於已結業課程顯示老師填寫的五星評分與見證。當 `gradRating` 為 null 時 SHALL 省略星等呈現；當 `gradTestimony` 為 null/空時 SHALL 省略見證呈現；兩者皆無時整段「整體學習狀況」SHALL 不顯示。此回饋 SHALL NOT 顯示於無結業檢視權限者（含該課程學員的一般前台）。

#### Scenario: 顯示老師五星與見證
- **WHEN** 管理者或課程老師檢視已結業且有填寫回饋的課程詳情
- **THEN** 結業資訊區塊顯示對應星等與見證文字

#### Scenario: 未填則省略區段
- **WHEN** 已結業課程的 `gradRating` 與 `gradTestimony` 皆為空
- **THEN** 結業資訊區塊不顯示「整體學習狀況」段落

#### Scenario: 僅有其一時只顯示該項
- **WHEN** 課程僅填了五星（或僅填了見證）
- **THEN** 只呈現有值的該項，另一項省略

#### Scenario: 無權限者不可見
- **WHEN** 不具結業檢視權限者檢視該課程
- **THEN** 不顯示老師的五星與見證

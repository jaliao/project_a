## ADDED Requirements

### Requirement: 開發環境表單預設值
合併開課表單（`CourseSessionForm`）SHALL 僅於開發環境（`isDev`）為欄位帶入示範用預設值（課程、課程名稱、人數上限、報名截止日 `expiredAt`、預計開課日 `courseDate`），其中 `expiredAt` SHALL 早於 `courseDate`；於非開發環境 SHALL 以空白預設值呈現。預設日期值 SHALL 在元件 render 期間保持穩定（不得於每次 render 重新計算而產生不純副作用）。

#### Scenario: 開發環境帶入示範預設值
- **WHEN** `isDev` 為 true 且存在可選課程，使用者開啟開課表單
- **THEN** 表單預設帶入示範課程、人數上限與日期，且 `expiredAt` 早於 `courseDate`

#### Scenario: 非開發環境不帶示範值
- **WHEN** `isDev` 為 false，使用者開啟開課表單
- **THEN** 表單以空白預設值呈現（課程未選、名稱與人數為空）

#### Scenario: 預設日期跨 render 穩定
- **WHEN** 元件因互動而多次 render
- **THEN** 預設日期值不隨每次 render 改變（於 render 期間視為純值）

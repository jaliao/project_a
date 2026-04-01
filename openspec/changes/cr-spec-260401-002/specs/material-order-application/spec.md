## ADDED Requirements

### Requirement: 出貨單顯示書本名稱
出貨單列印頁的「課程資訊」區塊 SHALL 顯示書本名稱（`CourseCatalog.label`）。

#### Scenario: 有關聯課程目錄時顯示書本名稱
- **WHEN** 管理者開啟出貨單列印頁且對應 CourseInvite 有 CourseCatalog 關聯
- **THEN** 顯示「書本名稱」列，內容為 `CourseCatalog.label`

#### Scenario: 無法取得書本名稱時顯示 fallback
- **WHEN** CourseInvite 未關聯 CourseCatalog（catalogLabel 為 null）
- **THEN** 顯示「書本名稱」列，內容為「（未填）」

## ADDED Requirements

### Requirement: 個人首頁在地化
個人首頁（`/user/{spiritId}`，`app/[locale]/(user)/user/[spiritId]/page.tsx` 及其子元件）的 UI 文案 SHALL 以 i18n 取用，SHALL NOT 於元件寫死中文字串，包含但不限於：頁面標題（「首頁」）、`metadata.title`、基本資料區塊標題與各欄位標籤（姓名、啟動編號、身分標籤、學習進度）、課程／授課／管理者／聯繫管理者各頂層區塊標題、學習進度三卡的狀態文字（已完成／進行中／未完成）與作業完成度文案（「已完成 X / 共 Y 課」）。課程目錄名稱（學習進度三卡上的「啟動靈人」等）之顯示語言依 `i18n-course-catalog-names` 規格之映射表處理，不在本需求範圍內重複定義。

server 文案 SHALL 用 `getTranslations`、client 互動（如性別補填對話框）SHALL 用 `useTranslations`，動態數值以 ICU 參數代入。既有頁面行為、顯示條件與版面結構（見本規格其餘需求）SHALL NOT 因本次在地化而改變。

#### Scenario: 英文模式檢視個人首頁無中文殘留
- **WHEN** 使用者以英文模式開啟任一 `/user/{spiritId}` 頁面
- **THEN** 頁面標題、分頁標題、基本資料各欄位標籤、學習進度卡狀態文字、各頂層區塊標題皆顯示為對應英文，不含中文（課程目錄名稱依 `i18n-course-catalog-names` 另行處理）

#### Scenario: 繁體模式維持原樣
- **WHEN** 使用者以預設 zh-TW 模式開啟同一頁面
- **THEN** 顯示文字與改版前完全一致

#### Scenario: 作業完成度文案在地化
- **WHEN** 以英文模式檢視已完成或進行中的學習進度卡，且該課程目錄有大綱
- **THEN** 作業完成度顯示為對應英文句式（如 "Completed 5 / 12 lessons"），數值透過 ICU 參數代入

#### Scenario: 既有顯示條件與版面不受影響
- **WHEN** 以任一語言檢視個人首頁
- **THEN** 各區塊的顯示條件（本人／他人視角、是否為管理者等）、排列順序與既有版面結構維持不變，僅文字語言隨當前 locale 呈現

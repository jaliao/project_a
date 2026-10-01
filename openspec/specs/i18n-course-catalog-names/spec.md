# i18n-course-catalog-names Specification

## Purpose
課程名稱（`CourseCatalog.label`）的顯示語言映射層：讓資料庫內容字串（如「啟動靈人」）能依當前語言顯示對應譯名，不修改 Prisma schema。

## Requirements

### Requirement: 課程名稱顯示語言映射表
系統 SHALL 提供 `catalog` i18n 命名空間（`messages/zh-TW.json`／`en.json`），以 `CourseCatalog.label` 現有的中文字串本身作為 key，value 為對應語言的課程名稱顯示文字。系統 SHALL 提供共用 helper（`translateCatalogLabel(t, label)`，`lib/utils/catalog-label.ts`）供所有顯示 `CourseCatalog.label` 的元件呼叫：命中對照表則回傳對應語言顯示名稱，未命中（例如新增課程目錄但尚未補 key）則 fallback 回傳原始 `label`，SHALL NOT 拋出錯誤或造成畫面中斷。

本需求 SHALL NOT 修改 `CourseCatalog` 的 Prisma schema、SHALL NOT 新增資料庫欄位或執行 migration；課程名稱的顯示語言完全由 `messages/*.json` 的映射表決定，`CourseCatalog.label` 本身的資料庫內容不變。

#### Scenario: 英文模式顯示英文課程名稱
- **WHEN** 以英文模式檢視任一顯示 `CourseCatalog.label` 的元件（課程卡片徽章、個人首頁學習進度三卡、課程分類標籤）
- **THEN** 「啟動靈人」顯示為 "Activate Spiritman"、「啟動豐盛」顯示為 "Activate Abundance"、「啟動得勝」顯示為 "Activate Victory"

#### Scenario: 繁體模式顯示原文
- **WHEN** 以預設 zh-TW 模式檢視同一元件
- **THEN** 顯示原始中文課程名稱，與改版前一致

#### Scenario: 未命中映射表時 fallback 原文
- **WHEN** 管理者新增一筆尚未補上 `catalog.*` key 的 `CourseCatalog` 記錄，使用者以英文模式檢視
- **THEN** 該課程名稱顯示為資料庫原始 `label`（中文），不拋出錯誤、不顯示空白或 key 名稱

#### Scenario: 品牌名稱亦納入映射表
- **WHEN** 任何顯示端需要呈現「啟動事工」作為課程/事工名稱語境下的文字且透過 `catalog` 命名空間取用
- **THEN** 英文模式顯示 "Activate Ministry"，與 `common.appName` 的譯名一致

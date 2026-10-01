## MODIFIED Requirements

### Requirement: 共用字串命名空間與遷移
系統 SHALL 提供 `common`（通用動作：儲存/取消/刪除/確認/返回/載入中/搜尋…）與 `nav`（導覽）共用命名空間，跨域共用元件（側邊/導覽、共用按鈕、空狀態、toast）SHALL 以 key 取用、不寫死語言字串。feature 專屬元件之字串不在本批。

`common.appName`（品牌系統名稱）SHALL 於所有語言維持單一一致的英文譯名 "Activate Ministry"；`footer.description`、`footer.copyright`、`seo.defaultTitle`、`seo.description` 等涉及品牌英文名稱之 key，其英文翻譯值 SHALL 統一採用 "Activate Ministry"，SHALL NOT 同時存在其他英文譯名（如 "Chidao Ministry"、"KUA Ministry"）。

#### Scenario: 共用元件以 key 取用
- **WHEN** 跨域共用元件（如側邊/導覽、共用按鈕）顯示文字
- **THEN** 透過 `common`/`nav` key 取用並隨當前語言呈現

#### Scenario: 通用動作詞集中
- **WHEN** 多處需要「儲存/取消/刪除」等通用動作詞
- **THEN** 取用同一 `common.*` key，不各自寫死

#### Scenario: feature 專屬字串不在本批
- **WHEN** 檢視 course/admin 等 feature 專屬元件
- **THEN** 其字串維持原狀（留待對應批次），缺 key 回退繁體

#### Scenario: 品牌英文名稱全站一致
- **WHEN** 以英文模式檢視品牌標記（`BrandLogo`）、Footer 品牌欄、SEO `<title>`／`description`
- **THEN** 三處顯示的品牌英文名稱皆為 "Activate Ministry"，不出現其他英文譯名

## ADDED Requirements

### Requirement: 頁面 metadata.title 以 i18n 取用
前台（`(guest)`／`(user)` route group，不含 `(admin)`）各頁面的 `metadata.title`（瀏覽器分頁標題）SHALL 透過 `generateMetadata`／`getTranslations` 以對應 feature 命名空間既有或新增的 `metaTitle` key 取用，SHALL NOT 於 `export const metadata` 寫死語言字串。`app/[locale]/layout.tsx` 既有的 `title.template`（`%s — {appName}`）機制不變，各頁仍僅需提供短標題。

#### Scenario: 英文模式分頁標題隨語言呈現
- **WHEN** 使用者以英文模式開啟任一前台頁面（如「我的提問」頁 `/user/{spiritId}/inquiries`）
- **THEN** 瀏覽器分頁標題顯示對應英文短標題＋站名後綴，不含中文

#### Scenario: 繁體模式維持原樣
- **WHEN** 使用者以預設 zh-TW 模式開啟同一頁面
- **THEN** 分頁標題顯示與改版前相同的繁體文字

#### Scenario: 後台頁面不在本次範圍
- **WHEN** 檢視 `(admin)` route group 下頁面的 `metadata.title`
- **THEN** 維持寫死繁體字串，不受本次規則影響

# public-course-intro Specification

## Purpose
對外可索引的免登入課程介紹頁 /courses：固定引言區必含「啟動靈人／啟動豐盛／啟動得勝」三個旗艦課程關鍵字（不依賴資料庫），課程清單資料驅動自啟用中的 CourseCatalog，並輸出 Organization／WebSite／Course JSON-LD；首頁與 footer 提供導引連結、首頁文案補齊三個課程名稱。

## Requirements

### Requirement: 免登入課程介紹頁

系統 SHALL 提供免登入頁面 `/courses`（`app/[locale]/(guest)/courses/page.tsx`），任何人（含未登入者與已登入者）皆可瀏覽，SHALL NOT 因已登入而強制轉走。頁面 SHALL 包含：站名頁首與登入連結、固定引言區、課程清單區、行動呼籲區、頁尾。頁面 SHALL 於 `lib/auth/route-access.ts` 的 `PUBLIC_PAGES` 註冊。

#### Scenario: 未登入者可瀏覽
- **WHEN** 未登入者開啟 `/courses`
- **THEN** 完整顯示頁面內容，不被導向登入頁

#### Scenario: 已登入者可瀏覽
- **WHEN** 已登入會員開啟 `/courses`
- **THEN** 顯示頁面內容，不強制轉向個人首頁

#### Scenario: 路由已註冊為公開
- **WHEN** middleware 判定 `/courses` 的存取
- **THEN** `isPublicRoute('/courses')` 為 true，免登入放行

### Requirement: 三旗艦課程關鍵字必定可見

`/courses` 頁的**固定引言區**（i18n 文案）SHALL 明確提及「啟動靈人」「啟動豐盛」「啟動得勝」三個課程名稱，並說明啟動事工的定位與適合對象。此段內容 SHALL NOT 依賴資料庫是否有對應課程資料——即使 `CourseCatalog` 為空，三個關鍵字仍出現在頁面可見文字與標題階層中。

#### Scenario: 引言涵蓋三個關鍵字
- **WHEN** 檢視 `/courses` 頁 HTML
- **THEN** 頁面可見文字含「啟動靈人」「啟動豐盛」「啟動得勝」三個詞，且至少一次出現在標題（`h1`／`h2`）中

#### Scenario: 無課程資料時引言仍完整
- **WHEN** `getActiveCourses()` 回傳空陣列
- **THEN** 固定引言區仍完整呈現三個課程名稱與事工介紹，不出現空白頁

### Requirement: 課程清單資料驅動

`/courses` 頁的課程清單區 SHALL 以 `getActiveCourses()`（`lib/data/course-catalog.ts`）取得啟用中的 `CourseCatalog`，依 `sortOrder` 逐一渲染為區塊：`label` 作 `<h2>`、`description` 作內文；`description` 為空時 SHALL 以 i18n 兜底簡介文字呈現（已知課程名有專屬預設句，未知則泛用句）。清單 SHALL NOT 顯示未啟用（`isActive = false`）的課程。

#### Scenario: 顯示啟用課程
- **WHEN** `CourseCatalog` 有兩筆 `isActive = true`（「啟動靈人」「啟動豐盛」）
- **THEN** 頁面依 `sortOrder` 顯示兩個區塊，各以課程名為 `<h2>`，並顯示其 `description` 或兜底簡介

#### Scenario: 略過未啟用課程
- **WHEN** 某 `CourseCatalog` 為 `isActive = false`
- **THEN** 該課程不出現在 `/courses` 清單

#### Scenario: description 為空時兜底
- **WHEN** 某啟用課程 `description` 為 null
- **THEN** 該區塊改顯示對應的 i18n 兜底簡介，不顯示空段落

### Requirement: 課程介紹頁 metadata 與結構化資料

`/courses` 頁 SHALL 設定專屬 metadata：`title`（經 template 呈現為「課程介紹 — 啟動事工」）、`description`（含三個課程關鍵字）、`alternates.canonical`（`/courses`）與 hreflang。頁面 SHALL 輸出 JSON-LD（`application/ld+json`），至少含 `Organization`、`WebSite`，以及以啟用課程組成的 `ItemList`／`Course`（`name` = 課程 label、`description`、`provider` 指向 Organization）。

#### Scenario: 課程介紹頁 canonical 正確
- **WHEN** 爬蟲抓取 `/courses`
- **THEN** `<head>` 的 canonical 為 `${getSiteUrl()}/courses`，`<title>` 含「課程介紹」

#### Scenario: 輸出 Course 結構化資料
- **WHEN** 解析 `/courses` 的 JSON-LD
- **THEN** 含 `ItemList`，其 `itemListElement` 內每個 `item` 的 `@type` 為 `Course`，`name` 對應啟用課程名稱

#### Scenario: 沒有啟用課程時仍有 Organization/WebSite
- **WHEN** `getActiveCourses()` 為空
- **THEN** JSON-LD 仍含 `Organization` 與 `WebSite` 節點，`ItemList` 可省略或為空陣列

### Requirement: 首頁導引與關鍵字補強

首頁 `/`（`app/[locale]/(guest)/page.tsx`）SHALL 提供指向 `/courses` 的連結（主視覺區或頁尾），且其可見文案（`<h1>` 副標／功能說明）SHALL 涵蓋「啟動靈人」「啟動豐盛」「啟動得勝」三個課程名稱（現況僅提及前兩者）。新增或調整的文案 SHALL 以 i18n key 取用。

#### Scenario: 首頁有課程介紹入口
- **WHEN** 未登入者開啟 `/`
- **THEN** 頁面有一個連結文字（如「課程介紹」）指向 `/courses`

#### Scenario: 首頁涵蓋三個課程名稱
- **WHEN** 檢視 `/` 頁可見文字
- **THEN** 含「啟動靈人」「啟動豐盛」「啟動得勝」三個詞

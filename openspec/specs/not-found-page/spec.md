# not-found-page Specification

## Purpose
TBD - created by archiving change cr-spec-260701-006. Update Purpose after archive.
## Requirements
### Requirement: 友善 404 頁與回到首頁
系統 SHALL 提供自訂 404（找不到頁面）畫面，套用既有主題與版面，且 SHALL 提供「回到首頁」按鈕連至 `/`。`[locale]` 範圍內由 `notFound()` 觸發者 SHALL 渲染套用 `[locale]` layout 的 404 頁並以 i18n 呈現文案；locale 外完全未匹配之網址 SHALL 有根層備援 404（自帶最小版面、含回首頁連結），不得呈現無樣式空白畫面。

#### Scenario: 造訪不存在資源顯示友善 404
- **WHEN** 使用者造訪不存在的資源（例：`/course/347` 觸發 `notFound()`）
- **THEN** 顯示套版面的 404 頁，含「回到首頁」按鈕

#### Scenario: 點回到首頁
- **WHEN** 使用者於 404 頁點「回到首頁」
- **THEN** 導向首頁 `/`

#### Scenario: 未匹配網址有備援
- **WHEN** 使用者造訪完全未匹配（locale 外）之網址
- **THEN** 顯示根層備援 404（非空白），並可回到首頁


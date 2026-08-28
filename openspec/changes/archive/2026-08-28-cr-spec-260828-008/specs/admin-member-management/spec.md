## ADDED Requirements

### Requirement: 會員首頁快捷入口

後台會員／講師相關的清單與詳情畫面 SHALL 提供一顆「會員首頁」按鈕，連往該會員的前台個人首頁 `/user/<spiritId 小寫>`（即 `app/[locale]/(user)/user/[spiritId]/page.tsx`）。

- 按鈕 SHALL 出現在下列位置的既有操作區，緊鄰「查看詳情」：
  - `/admin/members` 搜尋結果每列的「操作」欄；
  - `/admin/members/inactive` 未啟用會員每列的「操作」欄；
  - `/admin/members/[id]` 詳情頁頁首列。
- 連結 `href` SHALL 為 `/user/` 串接該會員 `spiritId` 的**小寫**字串（與 `components/layout/topbar.tsx` 產生會員首頁網址的慣例一致）。
- 按鈕 SHALL 於**新分頁**開啟（`target="_blank"`、`rel="noopener noreferrer"`），使管理者不離開目前的搜尋／篩選或詳情畫面。
- 當該會員 `spiritId` 為 null 或空字串時，按鈕 SHALL 呈現為停用（`disabled`）狀態且不產生連結，並提供提示文字說明「此會員尚無啟動編號」。
- 此入口為唯讀瀏覽既有頁面，SHALL NOT 以該會員身分登入或模擬其 session。
- 按鈕文字與提示 SHALL 以繁體中文直接呈現（後台專屬字串本階段不 i18n key 化）。

#### Scenario: 從搜尋結果進入會員首頁
- **WHEN** 管理者在 `/admin/members` 搜尋到一位具啟動編號 `PA260001` 的會員，點擊該列的「會員首頁」按鈕
- **THEN** 於新分頁開啟 `/user/pa260001`，顯示該會員的前台個人首頁；原搜尋結果分頁維持不變

#### Scenario: 詳情頁頁首的會員首頁按鈕
- **WHEN** 管理者位於 `/admin/members/<id>` 詳情頁，且該會員有啟動編號
- **THEN** 頁首列顯示「會員首頁」按鈕，點擊後於新分頁開啟該會員 `/user/<spiritId 小寫>`

#### Scenario: 會員無啟動編號時停用
- **WHEN** 清單中某會員（例如未啟用、從未登入）`spiritId` 為 null
- **THEN** 該列「會員首頁」按鈕呈現停用狀態、不可點擊、無 `href`，滑鼠停留顯示「此會員尚無啟動編號」

#### Scenario: 啟動編號大小寫正規化
- **WHEN** 會員的 `spiritId` 在資料庫存為大寫 `PA260123`
- **THEN** 「會員首頁」按鈕的連結為 `/user/pa260123`（小寫），可正確開啟該會員首頁

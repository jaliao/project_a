## MODIFIED Requirements

### Requirement: 已核准學員清單
課程詳情頁 SHALL 以**卡片式**顯示所有 `status=approved` 的 InviteEnrollment 學員：每張卡片包含姓名、書籍選擇（materialChoice 標籤）、加入時間、性別圖示（已設定時）、所屬教會文字（已設定時）；SHALL NOT 顯示學員 Email。手機單欄、較寬視窗雙欄排列。
區塊標題列右側 SHALL 對**管理者或該課講師**顯示兩顆操作按鈕（樣式比照課程基本資訊「編輯」按鈕）：**新增學員**與**移除學員**；一般學員視角 SHALL 與無按鈕時完全相同。
「新增學員」SHALL 開啟既有新增學員 dialog（email 掛既有帳號／建新帳號＋臨時密碼一次性顯示、可補登結業）。「移除學員」SHALL 切換**移除模式**：各學員卡出現移除按鈕（沿用醒目警示與教材防呆確認流程），且卡片加顯**啟動編號**輔助辨識（仍不顯示 Email）；再次點擊退出移除模式。

非移除模式下，每張學員卡片 SHALL 可點擊，點擊導向該學員的會員首頁 `/user/<spiritId 小寫>`（比照 `components/admin/member-home-link.tsx` 的連結模式），於**新分頁**開啟（`target="_blank"`、`rel="noopener noreferrer"`）。此連結 SHALL 對**任何能開啟本課程詳情頁的登入使用者**皆可點擊，不限管理者或該課講師（與卡片清單本身既有的可見範圍一致）。學員 `spiritId` 為 `null` 時，該卡片 SHALL NOT 產生連結，維持純顯示。移除模式啟用時，卡片 SHALL NOT 可點擊（避免與卡內移除按鈕的互動衝突）。

學員卡片 SHALL 顯示該學員的性別圖示（重用 `components/shared/gender-icon.tsx` 的 `GenderIcon`，僅圖示不加文字標籤，緊接於姓名後）：`gender` 為 `male`／`female` 時顯示對應圖示，為 `unspecified` 時 SHALL NOT 顯示任何性別圖示。學員卡片 SHALL 於**姓名列上方**顯示該學員的所屬教會文字（純文字，不加前綴標籤）：`churchType=church` 時顯示關聯 `Church.name`，`churchType=other` 時顯示 `churchOther` 自填文字；`churchType=none` 或對應文字為空時 SHALL NOT 顯示教會該行。性別圖示與教會文字的可見範圍 SHALL 與卡片其餘資訊一致——任何能開啟本課程詳情頁的登入使用者皆可見，不限管理者或該課講師。

#### Scenario: 有已核准學員
- **WHEN** 課程有至少一筆 status=approved 的 InviteEnrollment
- **THEN** 頁面以卡片顯示每位學員的姓名、materialChoice 標籤、joinedAt，不含 Email

#### Scenario: 尚無已核准學員
- **WHEN** 課程無任何 status=approved 記錄
- **THEN** 顯示「尚無已核准學員」空狀態

#### Scenario: 管理者與講師可見操作按鈕
- **WHEN** 管理者或該課講師開啟課程詳情頁
- **THEN** 已核准學員區塊標題列顯示「新增學員」「移除學員」按鈕

#### Scenario: 一般學員不可見操作按鈕
- **WHEN** 非管理者且非該課講師的使用者開啟課程詳情頁
- **THEN** 已核准學員區塊無任何管理按鈕，呈現與現行相同

#### Scenario: 移除模式
- **WHEN** 管理者或講師點擊「移除學員」
- **THEN** 各學員卡出現移除按鈕並加顯啟動編號；再次點擊「移除學員」退出模式

#### Scenario: 一般學員點擊學員卡片連到會員首頁
- **WHEN** 任一登入使用者（含一般學員）於非移除模式下點擊某已核准學員的卡片
- **THEN** 於新分頁開啟該學員的 `/user/<spiritId 小寫>` 會員首頁，原課程詳情頁維持不變

#### Scenario: 管理者或講師於非移除模式下點擊卡片
- **WHEN** 管理者或該課講師於非移除模式下點擊某已核准學員的卡片
- **THEN** 同樣於新分頁開啟該學員的會員首頁，行為與一般學員一致

#### Scenario: 移除模式下卡片不可點擊
- **WHEN** 管理者或講師已切換至移除模式
- **THEN** 學員卡片不產生會員首頁連結，點擊卡片本身不導向任何頁面，僅「移除」按鈕可操作

#### Scenario: 無啟動編號時不可點擊
- **WHEN** 某已核准學員卡片對應的 `spiritId` 為 `null`
- **THEN** 該卡片不產生連結，維持純顯示（與現行行為相同）

#### Scenario: 已設定性別顯示對應圖示
- **WHEN** 已核准學員的 `gender` 為 `male` 或 `female`
- **THEN** 卡片顯示對應的 `GenderIcon`，不顯示額外文字標籤

#### Scenario: 未設定性別不顯示圖示
- **WHEN** 已核准學員的 `gender` 為 `unspecified`
- **THEN** 卡片不顯示任何性別圖示，不產生空白佔位或「未設定」文字

#### Scenario: 已設定教會顯示教會文字
- **WHEN** 已核准學員的 `churchType` 為 `church`（有關聯 `Church`）或 `other`（有填 `churchOther`）
- **THEN** 卡片於姓名列**上方**顯示對應的教會名稱或自填文字，不加前綴標籤

#### Scenario: 未設定教會不顯示該行
- **WHEN** 已核准學員的 `churchType` 為 `none`，或對應文字為空
- **THEN** 卡片不顯示教會相關文字或行，不產生「未設定」文字

#### Scenario: 一般學員可見性別與教會資訊
- **WHEN** 非管理者且非該課講師的使用者開啟課程詳情頁
- **THEN** 已核准學員卡片上的性別圖示與教會文字顯示方式與管理者／講師視角完全一致

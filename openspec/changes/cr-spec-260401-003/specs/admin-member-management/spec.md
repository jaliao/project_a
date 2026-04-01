## ADDED Requirements

### Requirement: 會員清單搜尋
管理者 SHALL 能在 `/admin/members` 頁面透過搜尋列篩選會員，搜尋條件涵蓋 `realName`、`name`、`nickname`、`email` 欄位（OR 邏輯、不分大小寫、部分匹配）。搜尋條件 SHALL 透過 URL query string `?q=` 傳遞，以支援書籤與重新整理保留。

#### Scenario: 依姓名搜尋
- **WHEN** 管理者在搜尋列輸入名字後停頓（debounce）
- **THEN** 頁面更新 URL `?q=<輸入值>` 並僅顯示符合的會員

#### Scenario: 搜尋無結果
- **WHEN** 搜尋條件無任何符合的會員
- **THEN** 頁面顯示「查無符合的會員」提示文字，清單為空

#### Scenario: 清除搜尋
- **WHEN** 管理者清空搜尋列
- **THEN** 頁面顯示全部會員清單

---

### Requirement: 會員詳情頁
系統 SHALL 提供 `/admin/members/[id]` 頁面，顯示個別會員的基本資料、學習紀錄與授課紀錄。非管理者存取 SHALL 被重新導向至 `/`。

#### Scenario: 顯示基本資料
- **WHEN** 管理者進入 `/admin/members/[id]`
- **THEN** 頁面顯示：姓名（`realName`）、暱稱（`nickname`）、Email、靈人編號（`spiritId`）、角色（`role`）、加入日期（`createdAt`）

#### Scenario: 顯示學習紀錄
- **WHEN** 管理者進入 `/admin/members/[id]`
- **THEN** 頁面顯示該會員作為學員的課程清單，僅包含 `CourseInvite.startedAt IS NOT NULL` 的場次，欄位包含：課程名稱（`CourseInvite.title`）、課程目錄（`courseCatalog.label`）、開始授課日期（`startedAt`）

#### Scenario: 學習紀錄為空
- **WHEN** 該會員尚未參加任何已開始的課程
- **THEN** 學習紀錄區塊顯示「尚無學習紀錄」

#### Scenario: 顯示授課紀錄
- **WHEN** 管理者進入 `/admin/members/[id]`
- **THEN** 頁面顯示該會員作為建立者（`CourseInvite.createdById = userId`）的課程清單，僅包含 `startedAt IS NOT NULL` 的場次，欄位包含：課程名稱、課程目錄、開始授課日期

#### Scenario: 授課紀錄為空
- **WHEN** 該會員尚未建立任何已開始的課程
- **THEN** 授課紀錄區塊顯示「尚無授課紀錄」

#### Scenario: 找不到會員
- **WHEN** URL 中的 id 不存在
- **THEN** 頁面顯示 404 或重新導向至 `/admin/members`

---

### Requirement: 條件式會員刪除
系統 SHALL 僅在環境變數 `ENABLE_MEMBER_DELETE=true` 時於詳情頁顯示刪除按鈕。刪除前 SHALL 顯示 AlertDialog 二次確認，確認後執行 hard delete。

#### Scenario: 刪除按鈕依環境變數顯示
- **WHEN** `ENABLE_MEMBER_DELETE` 未設定或不為 `'true'`
- **THEN** 詳情頁不渲染任何刪除相關 UI

#### Scenario: 刪除確認流程
- **WHEN** 管理者點擊刪除按鈕並在 AlertDialog 確認
- **THEN** 系統呼叫 `deleteMember(userId)` Server Action，刪除成功後重新導向至 `/admin/members`

#### Scenario: 取消刪除
- **WHEN** 管理者在 AlertDialog 點擊取消
- **THEN** 關閉 dialog，不執行任何刪除動作

## MODIFIED Requirements

### Requirement: 會員詳情頁
系統 SHALL 提供 `/admin/members/[id]` 頁面，以 shadcn Tabs 元件呈現兩個分頁：「基本資料」（包含基本資訊、操作按鈕、學習紀錄、授課紀錄）與「學習階層」（顯示師生傳承樹）。非管理者存取 SHALL 被重新導向至 `/`。

#### Scenario: 顯示基本資料分頁
- **WHEN** 管理者進入 `/admin/members/[id]`
- **THEN** 預設顯示「基本資料」分頁，內容包含：姓名（`realName`）、**英文名稱（`englishName`）**、暱稱（`nickname`）、**性別（`gender`）**、**顯示名稱（`getMemberDisplayName()` 結果）**、Email、靈人編號（`spiritId`）、角色（`role`）、加入日期（`createdAt`）、所屬教會/單位、操作按鈕（重設密碼、刪除）、學習紀錄表格、授課紀錄表格

#### Scenario: 英文名稱顯示
- **WHEN** 會員有填寫英文名稱
- **THEN** 詳情頁顯示英文名稱值；未填寫則顯示「—」

#### Scenario: 性別顯示
- **WHEN** 管理者進入詳情頁
- **THEN** 性別欄位顯示「男」、「女」或「—」（unspecified）

#### Scenario: 顯示名稱欄位
- **WHEN** 管理者進入詳情頁
- **THEN** 顯示名稱欄位顯示 `getMemberDisplayName()` 計算後的結果（含格式化括號）

#### Scenario: 切換至學習階層分頁
- **WHEN** 管理者點擊「學習階層」分頁標籤
- **THEN** 顯示 `MemberHierarchyTree` 元件，呈現該會員的師生傳承樹

#### Scenario: 找不到會員
- **WHEN** URL 中的 id 不存在
- **THEN** 頁面顯示 404 或重新導向至 `/admin/members`

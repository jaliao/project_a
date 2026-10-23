## ADDED Requirements

### Requirement: 未註冊會員專區分頁（唯讀邀請紀錄）

會員詳情頁 SHALL 新增分頁「未註冊會員專區」，置於 `TabsList` 最前面（「基本資料」之前）。此分頁 SHALL 對所有會員恆顯示唯讀的「代填學員邀請紀錄」列表（見該 Requirement），不因 `isProxyMember` 現值為真或假而改變顯示內容——即使該會員已完成註冊或從未當過代填學員，仍可查閱其歷史紀錄（或空狀態）。此分頁 SHALL NOT 包含任何編輯邀請 Email 或補發邀請的互動元件（該操作已移至該會員的會員首頁，見 `student-profile-page` 的「未註冊學員邀請管理」）。

分頁預設開啟（`Tabs` 的 `defaultValue`）SHALL 維持「基本資料」，不因新增此分頁而改變。

#### Scenario: 分頁置於最前
- **WHEN** 管理者開啟任一會員詳情頁
- **THEN** `TabsList` 第一個分頁為「未註冊會員專區」，其後依序為基本資料、學習階層、講師身分、特殊設定

#### Scenario: 分頁內容不依 isProxyMember 切換
- **WHEN** 管理者分別開啟 `isProxyMember = true` 與 `isProxyMember = false` 兩個帳號的詳情頁
- **THEN** 兩者的「未註冊會員專區」分頁皆顯示該帳號的邀請紀錄列表（或空狀態），不因 `isProxyMember` 而出現「不適用」之類的替代文案

#### Scenario: 分頁不含編輯元件
- **WHEN** 管理者開啟任一會員的「未註冊會員專區」分頁
- **THEN** 分頁僅顯示唯讀歷史列表，不顯示邀請 Email 輸入欄或「補發邀請」按鈕

#### Scenario: 預設開啟分頁不變
- **WHEN** 管理者開啟任一會員詳情頁
- **THEN** 頁面預設顯示「基本資料」分頁，不自動跳至「未註冊會員專區」

### Requirement: 代填學員邀請紀錄

「未註冊會員專區」分頁 SHALL 顯示該會員所有 `ProxyInviteToken` 的歷史紀錄列表，依核發時間（`createdAt`）新到舊排序。每筆紀錄 SHALL 顯示：核發時間、對應 email 快照、狀態、過期時間（`expiresAt`）。狀態 SHALL 依下列優先順序判定：`usedAt` 非 null → 「已完成註冊」；否則 `voidedAt` 非 null → 「已作廢」；否則 `expiresAt` 早於目前時間 → 「已過期」；否則 → 「有效」。

#### Scenario: 顯示多筆歷史紀錄
- **WHEN** 某代填學員被核發過兩筆 `ProxyInviteToken`（第二筆因補發邀請核發）
- **THEN** 邀請紀錄列表顯示兩筆紀錄：較舊一筆狀態為「已作廢」，最新一筆狀態為「有效」或依其過期狀態顯示

#### Scenario: 顯示已完成註冊狀態
- **WHEN** 某筆 `ProxyInviteToken` 的 `usedAt` 已被 `completeProxyRegistration` 標記
- **THEN** 該筆紀錄狀態顯示「已完成註冊」，即使 `voidedAt` 為 null

#### Scenario: 顯示已過期狀態
- **WHEN** 某筆 `ProxyInviteToken` 的 `expiresAt` 已早於目前時間，且 `usedAt`／`voidedAt` 皆為 null
- **THEN** 該筆紀錄狀態顯示「已過期」

#### Scenario: 已完成註冊會員仍可查閱歷史
- **WHEN** 某會員已透過邀請連結完成註冊（`isProxyMember` 現為 `false`）
- **THEN** 管理者仍可在其「未註冊會員專區」分頁看到完整的歷史紀錄，不因完成註冊而被隱藏或清空

#### Scenario: 從未當過代填學員顯示空狀態
- **WHEN** 某會員從未被核發過任何 `ProxyInviteToken`
- **THEN** 邀請紀錄列表顯示「尚無邀請紀錄」提示文字

## REMOVED Requirements

### Requirement: 代填學員邀請 Email 管理

**Reason**: 編輯邀請 Email／補發邀請的操作入口自後台會員詳情頁移至該會員的會員首頁（`/user/{spiritId}`），並開放給管理者或該學員所屬班級的授課老師操作，不再是後台專屬、admin-only 的功能。對應行為改由 `proxy-invite` 能力（授權範圍）與 `student-profile-page` 能力（「未註冊學員邀請管理」區塊）定義。

**Migration**: 後台會員詳情頁不再顯示此區塊；原 `components/admin/member-proxy-invite-form.tsx` 刪除，由新元件 `components/dashboard/proxy-invite-panel.tsx`（置於會員首頁）取代。

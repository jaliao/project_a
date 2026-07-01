# admin-instructor-recommendations Specification

## Purpose
TBD - created by archiving change cr-spec-260701-002. Update Purpose after archive.
## Requirements
### Requirement: 推薦講師清單
後台推薦講師頁 SHALL 列出老師的講師推薦（`InviteEnrollment.teacherRecommended = true`），依回饋時間（`teacherFeedbackAt`）由新到舊排序，並 SHALL 提供狀態篩選，**預設顯示未處理**。每列 SHALL 顯示：被推薦人（顯示名＋啟動編號）、推薦書別（課程階層）、推薦老師、回饋備註、回饋時間、狀態。此頁 SHALL 僅限管理者（`canAccessAdmin`）存取，並 SHALL 以分頁呈現。

#### Scenario: 依回饋時間新到舊列出
- **WHEN** 管理者開啟推薦講師頁
- **THEN** 清單以 `teacherFeedbackAt` 由新到舊排列，且預設僅顯示未處理者

#### Scenario: 僅列已推薦
- **WHEN** 某回饋為未推薦（`teacherRecommended` 非 true）
- **THEN** 不出現在推薦講師清單

#### Scenario: 非管理者不可存取
- **WHEN** 不具 `canAccessAdmin` 者存取此頁
- **THEN** 拒絕存取

### Requirement: 推薦狀態推導
系統 SHALL 依下列規則推導每筆推薦狀態（優先序 accepted > deferred > pending）：
- **已成為講師（accepted）**：被推薦人已具該書別對應的書籍講師身分（`TEACHER_ROLE_BY_CATALOG[courseCatalogId]` ∈ `user.roles`）。
- **暫不接受（deferred）**：`recommendDeferredAt` 有值且尚未成為講師。
- **未處理（pending）**：其餘（未成為講師且未暫不接受）。

#### Scenario: 已指派身分即為已成為講師
- **WHEN** 被推薦人已被指派該書別的書籍講師身分
- **THEN** 該筆推薦狀態顯示為「已成為講師」，且不需要進一步操作

#### Scenario: 指派身分後自動脫離未處理
- **WHEN** 管理者於會員頁指派對應書籍講師身分後返回清單
- **THEN** 該筆不再計入未處理，狀態轉為「已成為講師」

### Requirement: 暫不接受推薦與取消
系統 SHALL 允許管理者對未處理的推薦標記「暫不接受」，記錄備註、時間與操作管理者（`recommendDeferralNote` / `recommendDeferredAt` / `recommendDeferredById`），並 SHALL 允許取消暫不接受（清除上述紀錄，回到未處理）。暫不接受狀態 SHALL 於清單顯示其備註、時間與管理者。

#### Scenario: 標記暫不接受
- **WHEN** 管理者對某未處理推薦填寫備註並確認「暫不接受」
- **THEN** 記錄 `recommendDeferredAt=現在`、`recommendDeferredById=操作者`、`recommendDeferralNote=備註`，狀態轉為「暫不接受」

#### Scenario: 取消暫不接受
- **WHEN** 管理者對某暫不接受的推薦點「取消暫不接受」
- **THEN** 清除三個 defer 欄位，狀態回到「未處理」

### Requirement: 另開視窗檢視會員
清單每列 SHALL 提供以新視窗開啟該被推薦會員詳情（`/admin/members/{userId}`）的連結，供管理者查閱會員資訊並於該處指派書籍講師身分。

#### Scenario: 另開視窗看會員
- **WHEN** 管理者於某列點「查看會員」
- **THEN** 於新視窗（新分頁）開啟該會員的後台詳情頁


## ADDED Requirements

### Requirement: 顯示已接受邀請學員清單
首頁「新增開課」區塊下方 SHALL 顯示最新一筆 CourseInvite 的已接受邀請學員清單。

#### Scenario: 有已接受邀請的學員
- **WHEN** 最新 CourseInvite 有 status 為 accepted 的 InviteEnrollment
- **THEN** 系統列出每位學員的暱稱（姓名 | 性別）與接受邀請時間

#### Scenario: 尚無學員接受邀請
- **WHEN** 最新 CourseInvite 無已接受的 InviteEnrollment
- **THEN** 系統顯示「尚無學員接受邀請」提示文字

#### Scenario: 尚未建立任何邀請
- **WHEN** 系統中無任何 CourseInvite 記錄
- **THEN** 學員清單區塊不顯示或顯示空白提示

### Requirement: 學員暱稱格式為「姓名 | 性別」
學員顯示名稱 SHALL 以「{displayName} | {gender}」格式呈現，其中 gender 顯示為中文（男性、女性、其他）。

#### Scenario: 學員有完整姓名與性別資料
- **WHEN** 學員的 User 記錄有 displayName 與 gender
- **THEN** 清單顯示「王小明 | 男性」格式

#### Scenario: 學員缺少性別資料
- **WHEN** 學員的 User 記錄 gender 為 null
- **THEN** 清單顯示「王小明 | —」

### Requirement: 顯示接受邀請時間
學員清單 SHALL 顯示每位學員的接受邀請時間（InviteEnrollment.acceptedAt 或 updatedAt），格式為「YYYY/MM/DD HH:mm」。

#### Scenario: 顯示接受時間
- **WHEN** 學員已接受邀請
- **THEN** 清單顯示對應的接受時間

## Why

目前新增開課流程為單一 Dialog，資訊全部混在一起，缺乏引導性；且沒有在 UI 層對「講師身分」做入口管控，亦無法透過填寫會員編號邀請學員。需要重新設計成多步驟精靈，並補齊邀請方式。

## What Changes

- 將現有「新增開課」單一 Dialog 重設計為三步驟精靈流程
  - **Step 1**：卡片式選擇開課課程（靈人啟動 1 / 靈人啟動 2）
  - **Step 2**：填寫開課基本資料（日期、預計人數等）
  - **Step 3**：預覽確認後完成開課，進入邀請學員階段
- 在精靈入口進行身分檢核：
  - `user` 身分需具備對應課程的「講師標籤」（`InviteEnrollment.graduatedAt` 有值）才能開課
  - `admin` / `superadmin` 豁免，無需先修完成亦可開課
- 新增「透過會員編號邀請」：填入 Spirit ID → 確認後發送 Inbox 通知給被邀請學員
- 課程目錄維護（isActive、prerequisiteLevel）維持 config-driven，不新增 admin UI（現有設定已足夠）

## Capabilities

### New Capabilities
- `create-course-wizard`：三步驟開課精靈，含身分檢核、卡片課程選擇、基本資料填寫、預覽確認

### Modified Capabilities
- `create-course-session`：原有單一 Dialog 流程由 `create-course-wizard` 取代，保留 server action 邏輯但移除 Dialog UI
- `course-invite`：邀請階段新增「填寫 Spirit ID 邀請」方式，填入後確認發送 Inbox 通知給對應學員

## Impact

- **新增**: `components/course/create-course-wizard/` — 多步驟精靈元件（Step1CourseCard、Step2BasicInfo、Step3Preview）
- **修改**: `app/(user)/dashboard/` 或對應頁面 — 開課入口改為觸發精靈而非舊 Dialog
- **修改**: `app/actions/course-invite.ts` — 新增 `inviteBySpirtId(spiritId)` action，查找 User 並發送通知
- **修改**: `components/course/invite-section/` — 邀請區塊新增 Spirit ID 輸入表單
- **不需要**: DB schema 變更（現有 CourseInvite、InviteEnrollment、Notification 結構足夠）

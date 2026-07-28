## Why

課程若誤點「結業」或需修正結業資料（如漏了學員、評分心得需重填），目前沒有任何方式退回進行中，只能手動改資料庫。需要提供講師與管理者可自行操作的「結業回退」功能。

（「進行中退回招生中」已有現成的「重新招募作業」功能，本次不需新做，僅新增「已結業退回進行中」。）

## What Changes

- 課程詳情頁已結業狀態時，新增「結業回退」區塊（講師與管理者可操作，比照既有「重新招募作業」的權限與呈現方式）。
- 執行回退時，系統 SHALL 完整復原結業當下寫入的資料：
  - 清除 `CourseInvite.completedAt`（課程狀態回到進行中）
  - 清除 `CourseInvite.gradRating`／`gradTestimony`（班級評分與心得）
  - 清除該課所有學員 `InviteEnrollment.graduatedAt`／`nonGraduateReason`（恢復為 approved、未結業狀態）
- 確認視窗 SHALL 明確提示：已寄出的結業信無法收回，若日後重新結業將對同一批學員再寄一次結業信（重複寄信風險）。
- 不處理已產生的實體證書資格佇列／已標記完成之證書（`CertificateProduction`，以 `userId`+`courseCatalogId` 為鍵、非綁定單一班級）——這部分沿用既有後台證書管理機制，管理者可自行於證書製作頁處理，不在本次自動化範圍內。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `cancel-course-session`：新增「結業回退作業」需求（與既有「重新招募作業」同屬課程狀態退回類操作）

## Impact

- `app/actions/course-invite.ts`：新增 `revertGraduation`（或同等命名）server action，於單一交易內清除 `CourseInvite.completedAt`／`gradRating`／`gradTestimony` 與該課全部 `InviteEnrollment.graduatedAt`／`nonGraduateReason`。
- `app/[locale]/(user)/course/[id]/course-detail-actions.tsx`：已結業狀態時新增「結業回退」區塊與確認 Dialog（含重複寄信提醒文案）。
- 不寄信、不建立通知（比照 `reopenRecruitment` 的既有慣例）；是否寫入操作 LOG 於 design 階段決定。
- 無 migration（沿用既有欄位）。

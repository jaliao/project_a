## Why

正式環境部分學員帳號 `churchType=none`（未設定教會），但這些學員實際是透過某位老師開設的課程邀請（`CourseInvite`）報名加入課程（`InviteEnrollment`），開課老師本身已設定教會（`User.churchType`/`churchId`/`churchOther`）。目前學員教會資訊未隨報名關係帶入，造成後台教會分布統計（`admin/dashboard` 教會分布圖表、會員清單教會篩選）低估實際歸屬教會的學員數。

本次僅處理**現有資料**的一次性回填，不變更任何既有報名／開課流程的程式邏輯。

## What Changes

- 對**正式環境資料庫**執行一次性資料修正：針對 `churchType=none` 的學員，依其所有 `InviteEnrollment` 記錄取 `joinedAt` 最新一筆，找出該筆報名所屬 `CourseInvite.createdBy`（開課老師），將該老師的 `churchType`／`churchId`／`churchOther` 原樣複製給學員。
- 若該學員完全沒有任何 `InviteEnrollment`，或其最新一筆報名對應的老師本身也是 `churchType=none`，該學員跳過不處理。
- 無 schema 變更、無新增 UI、無新增 capability，純資料回填。

## Capabilities

### No Capability Changes

本次為一次性正式環境資料修正，不新增或修改任何系統行為規格，不產生 delta spec，archive 時無需同步主規格。

## Impact

- 正式環境資料庫 `users` 表：僅更新符合條件學員的 `churchType`／`churchId`／`churchOther` 三欄 + `updatedAt`，無結構異動。
- 執行前以唯讀查詢列出受影響清單（學員 email/spiritId、對應老師、老師教會）供人工核對，執行後以 SELECT 覆核筆數與抽樣內容。
- 不修改任何程式碼、不影響既有報名/開課流程。

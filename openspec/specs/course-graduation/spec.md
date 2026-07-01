# course-graduation Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for course-graduation.
## Requirements
### Requirement: 結業時選擇通過學員
講師執行結業操作時，系統 SHALL 顯示 Dialog，列出所有已核准（approved）的學員供講師勾選，講師至少須勾選一位學員方可確認結業。

#### Scenario: 開啟結業 Dialog
- **WHEN** 講師在課程詳情頁點擊「結業」按鈕
- **THEN** 系統開啟 Dialog，列出所有 `status = approved` 的學員（顯示姓名與 Email），每位學員旁有勾選框

#### Scenario: 預設全選
- **WHEN** 結業 Dialog 開啟
- **THEN** 所有已核准學員預設為勾選狀態

#### Scenario: 取消勾選部分學員
- **WHEN** 講師取消勾選某位學員後確認結業
- **THEN** 該學員的 `InviteEnrollment.graduatedAt` 不設值（不獲得結業證明）

#### Scenario: 未勾選任何學員時無法確認
- **WHEN** 講師未勾選任何學員即嘗試確認結業
- **THEN** 系統顯示錯誤提示「請至少選擇一位通過結業的學員」，不執行結業

#### Scenario: 確認結業
- **WHEN** 講師勾選學員後點擊「確認結業」
- **THEN** 系統將 `CourseInvite.completedAt` 設為當前時間，被勾選學員的 `InviteEnrollment.graduatedAt` 設為當前時間，頁面更新為結業狀態

### Requirement: 無已核准學員時禁止結業
課程若沒有任何 `status = approved` 的學員，講師 SHALL 無法執行結業操作。

#### Scenario: 沒有已核准學員
- **WHEN** 課程沒有任何 approved 學員，講師點擊結業
- **THEN** 系統顯示提示「尚無已核准學員，無法結業」，不開啟 Dialog

### Requirement: 結業時可記錄班級整體學習狀況
結業送出流程 SHALL 允許老師對整班填寫「本次學員整體學習狀況」＝五星評分（1–5）與見證文字，兩者**皆為選填**，寫入 `CourseInvite.gradRating` / `gradTestimony`（一課一則）。系統 SHALL NOT 因五星或見證未填而阻擋結業送出。伺服器端 SHALL 驗證：`gradRating` 僅接受 1–5，否則存 null；`gradTestimony` 去除前後空白後為空字串則存 null。此欄位為結業當下由老師填寫，與逐位學員的結業狀態/未結業原因獨立。

#### Scenario: 填寫五星與見證後結業
- **WHEN** 老師於結業表單選擇五星並輸入見證，送出結業
- **THEN** 該課程 `completedAt` 設定完成，且 `gradRating` 存為所選星等（1–5）、`gradTestimony` 存為見證文字

#### Scenario: 未填仍可完成結業
- **WHEN** 老師未選五星、未輸入見證即送出結業
- **THEN** 結業照常完成，`gradRating` 與 `gradTestimony` 皆為 null

#### Scenario: 五星超出範圍視為未評
- **WHEN** 送出的 `gradRating` 不在 1–5 範圍（或為清除/0）
- **THEN** 系統將 `gradRating` 存為 null

#### Scenario: 見證僅空白視為未填
- **WHEN** 見證欄僅含空白字元
- **THEN** 系統將 `gradTestimony` 存為 null


## ADDED Requirements

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

# course-status Specification

## Purpose
TBD - normalized for archive compatibility. Update Purpose for course-status.
## Requirements
### Requirement: 課程詳情頁「開始上課」按鈕
課程詳情頁講師操作區 SHALL 在課程為招生中（`startedAt = null`、`cancelledAt = null`、`completedAt = null`）時**常駐顯示**「開始上課」按鈕，且按鈕上方 SHALL 顯示**開始上課日期**欄位（date picker），預設為今天、最大可選日期為今天。
按鈕 SHALL 僅在下列條件全部成立時為啟用狀態，否則為停用（disabled）：
1. 該課程至少有 **1 位已核准（approved）學員**；
2. 該課程**尚未申請的教材需求為 0**（已核准學員之 `materialChoice` 繁/簡總需求，皆已由教材訂單的繁/簡數量涵蓋）**或該課程已標記「教材申請已完成」**（`materialFinalizedAt != null`）；
3. 該課程**所有教材訂單皆已收件**（每筆 `CourseOrder.receivedAt != null`）。
當全班皆不需教材（總需求為 0）且無教材訂單時，條件 2、3 視為成立。
按鈕為停用時，旁邊 SHALL 列出**所有未達成的原因**。
點擊啟用中的按鈕 SHALL 先開啟**確認視窗**，顯示所選開課日期與已核准學員人數；講師於視窗按「確認開始」後 SHALL 以所選日期呼叫 `startCourseSession(inviteId, startDate)`，按「取消」則關閉視窗、不執行任何操作。
`startCourseSession` SHALL 驗證 `startDate` 為有效日期且不晚於伺服器當日（允許過去日期），並於 server 端以當下資料重算後重新驗證上述開課條件；任一驗證未達成時拒絕並回傳具體原因。驗證通過時 SHALL 將**講師所選日期**寫入 `startedAt`（而非當下系統時間）。

#### Scenario: 條件全部達成 — 開始上課按鈕啟用
- **WHEN** 課程招生中、有 ≥1 已核准學員、尚未申請需求為 0、且所有教材訂單皆已收件
- **THEN** 顯示啟用狀態的「開始上課」按鈕，按鈕上方顯示預設為今天的開始上課日期欄位

#### Scenario: 尚無已核准學員 — 按鈕停用並顯示原因
- **WHEN** 課程招生中但無任何 approved 學員
- **THEN** 「開始上課」按鈕為停用狀態，並顯示原因「尚無已核准學員」

#### Scenario: 尚有教材未申請 — 按鈕停用並顯示原因
- **WHEN** 教材訂單皆已收件後，又核准一位選書（繁或簡）的學員，使尚未申請需求 > 0，且課程未標記「教材申請已完成」
- **THEN** 「開始上課」按鈕為停用狀態，並顯示原因「尚有教材未申請（繁 X、簡 Y）」

#### Scenario: 教材申請已完成 — 豁免需求條件
- **WHEN** 課程招生中、有 ≥1 已核准學員、尚未申請需求 > 0，但課程已標記「教材申請已完成」，且無未收件之教材訂單
- **THEN** 顯示啟用狀態的「開始上課」按鈕（教材需求條件視為成立）

#### Scenario: 已完成但訂單未全收件 — 仍停用
- **WHEN** 課程已標記「教材申請已完成」，但既有教材訂單中至少一筆 `receivedAt == null`
- **THEN** 「開始上課」按鈕為停用狀態，並顯示原因「教材訂單尚未全部收件」

#### Scenario: 教材未全部收件 — 按鈕停用並顯示原因
- **WHEN** 課程招生中、需求已全部申請，但其中至少一筆訂單 `receivedAt == null`
- **THEN** 「開始上課」按鈕為停用狀態，並顯示原因「教材訂單尚未全部收件」

#### Scenario: 全班不需教材 — 允許開課
- **WHEN** 課程招生中、有 ≥1 已核准學員、所有已核准學員皆選「不需教材」（總需求為 0）、且無教材訂單
- **THEN** 顯示啟用狀態的「開始上課」按鈕

#### Scenario: 進行中不顯示開始上課按鈕
- **WHEN** 課程 `startedAt != null`
- **THEN** 不顯示「開始上課」按鈕與開始上課日期欄位

#### Scenario: 點擊開始上課 — 開啟確認視窗
- **WHEN** 講師點擊啟用中的「開始上課」按鈕
- **THEN** 開啟確認視窗，顯示所選開課日期與已核准學員人數（例：開課日期 2026/07/07、上課人數 8 位）

#### Scenario: 確認視窗取消 — 不執行
- **WHEN** 講師於確認視窗按「取消」
- **THEN** 視窗關閉，課程狀態不變、`startedAt` 仍為 null

#### Scenario: 確認開始成功 — 記錄所選日期
- **WHEN** 講師選擇過去或今天的日期、於確認視窗按「確認開始」，且 server 端條件驗證通過
- **THEN** `startedAt` 寫入講師所選日期，課程狀態變為進行中，頁面刷新，toast 顯示「課程已開始」

#### Scenario: 未來日期被拒絕
- **WHEN** `startCourseSession` 收到晚於伺服器當日的 `startDate`
- **THEN** action 回傳 `success: false` 與原因，課程狀態不變（前端日期欄位 `max` 亦限制至今天）

#### Scenario: server 端條件未達成時拒絕
- **WHEN** `startCourseSession` 被呼叫但 approved 學員數 < 1、尚有教材未申請（且未標記完成）、或教材未全部收件
- **THEN** action 回傳 `success: false` 與具體原因，課程狀態不變


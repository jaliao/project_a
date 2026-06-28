## MODIFIED Requirements

### Requirement: 課程詳情頁「開始上課」按鈕
課程詳情頁講師操作區 SHALL 在課程為招生中（`startedAt = null`、`cancelledAt = null`、`completedAt = null`）時**常駐顯示**「開始上課」按鈕。
按鈕 SHALL 僅在下列條件全部成立時為啟用狀態，否則為停用（disabled）：
1. 該課程至少有 **1 位已核准（approved）學員**；
2. 該課程**尚未申請的教材需求為 0**（已核准學員之 `materialChoice` 繁/簡總需求，皆已由教材訂單的繁/簡數量涵蓋）；
3. 該課程**所有教材訂單皆已收件**（每筆 `CourseOrder.receivedAt != null`）。
當全班皆不需教材（總需求為 0）且無教材訂單時，條件 2、3 視為成立。
按鈕為停用時，旁邊 SHALL 列出**所有未達成的原因**。
點擊啟用中的按鈕後 SHALL 呼叫 `startCourseSession`；該 action SHALL 於 server 端以當下資料重算後重新驗證上述條件，未達成時拒絕並回傳具體原因。

#### Scenario: 條件全部達成 — 開始上課按鈕啟用
- **WHEN** 課程招生中、有 ≥1 已核准學員、尚未申請需求為 0、且所有教材訂單皆已收件
- **THEN** 顯示啟用狀態的「開始上課」按鈕

#### Scenario: 尚無已核准學員 — 按鈕停用並顯示原因
- **WHEN** 課程招生中但無任何 approved 學員
- **THEN** 「開始上課」按鈕為停用狀態，並顯示原因「尚無已核准學員」

#### Scenario: 尚有教材未申請 — 按鈕停用並顯示原因
- **WHEN** 教材訂單皆已收件後，又核准一位選書（繁或簡）的學員，使尚未申請需求 > 0
- **THEN** 「開始上課」按鈕為停用狀態，並顯示原因「尚有教材未申請（繁 X、簡 Y）」

#### Scenario: 教材未全部收件 — 按鈕停用並顯示原因
- **WHEN** 課程招生中、需求已全部申請，但其中至少一筆訂單 `receivedAt == null`
- **THEN** 「開始上課」按鈕為停用狀態，並顯示原因「教材訂單尚未全部收件」

#### Scenario: 全班不需教材 — 允許開課
- **WHEN** 課程招生中、有 ≥1 已核准學員、所有已核准學員皆選「不需教材」（總需求為 0）、且無教材訂單
- **THEN** 顯示啟用狀態的「開始上課」按鈕

#### Scenario: 進行中不顯示開始上課按鈕
- **WHEN** 課程 `startedAt != null`
- **THEN** 不顯示「開始上課」按鈕

#### Scenario: 點擊開始上課成功
- **WHEN** 講師點擊啟用中的「開始上課」並確認，且 server 端條件驗證通過
- **THEN** 課程狀態變為進行中，頁面刷新，toast 顯示「課程已開始」

#### Scenario: server 端條件未達成時拒絕
- **WHEN** `startCourseSession` 被呼叫但 approved 學員數 < 1、尚有教材未申請、或教材未全部收件
- **THEN** action 回傳 `success: false` 與具體原因，課程狀態不變

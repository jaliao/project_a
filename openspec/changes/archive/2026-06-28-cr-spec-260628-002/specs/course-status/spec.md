## MODIFIED Requirements

### Requirement: 課程詳情頁「開始上課」按鈕
課程詳情頁講師操作區 SHALL 在課程為招生中（`startedAt = null`、`cancelledAt = null`、`completedAt = null`）時**常駐顯示**「開始上課」按鈕。
按鈕 SHALL 僅在下列條件全部成立時為啟用狀態，否則為停用（disabled）：
1. 該課程至少有 **1 位已核准（approved）學員**；
2. 該課程**至少有一筆**教材訂單，且**所有**教材訂單皆已收件（每筆 `CourseOrder.receivedAt != null`）。
按鈕為停用時，旁邊 SHALL 列出**所有未達成的原因**。
點擊啟用中的按鈕後 SHALL 呼叫 `startCourseSession`；該 action SHALL 於 server 端重新驗證上述條件，未達成時拒絕並回傳具體原因。

#### Scenario: 條件全部達成 — 開始上課按鈕啟用
- **WHEN** 課程招生中、有 ≥1 已核准學員、且所有教材訂單皆已收件（至少一筆）
- **THEN** 顯示啟用狀態的「開始上課」按鈕

#### Scenario: 尚無已核准學員 — 按鈕停用並顯示原因
- **WHEN** 課程招生中但無任何 approved 學員
- **THEN** 「開始上課」按鈕為停用狀態，並顯示原因「尚無已核准學員」

#### Scenario: 尚未申請任何教材 — 按鈕停用並顯示原因
- **WHEN** 課程招生中但尚無任何教材訂單
- **THEN** 「開始上課」按鈕為停用狀態，並顯示原因「尚未申請任何教材」

#### Scenario: 教材未全部收件 — 按鈕停用並顯示原因
- **WHEN** 課程招生中、已有教材訂單，但其中至少一筆 `receivedAt == null`
- **THEN** 「開始上課」按鈕為停用狀態，並顯示原因「教材訂單尚未全部收件」

#### Scenario: 多項未達成 — 同時列出所有原因
- **WHEN** 課程招生中、無 approved 學員且教材尚未全部收件
- **THEN** 「開始上課」按鈕為停用狀態，並同時列出「尚無已核准學員」與教材未收件兩項原因

#### Scenario: 進行中不顯示開始上課按鈕
- **WHEN** 課程 `startedAt != null`
- **THEN** 不顯示「開始上課」按鈕

#### Scenario: 點擊開始上課成功
- **WHEN** 講師點擊啟用中的「開始上課」並確認，且 server 端條件驗證通過
- **THEN** 課程狀態變為進行中，頁面刷新，toast 顯示「課程已開始」

#### Scenario: server 端條件未達成時拒絕
- **WHEN** `startCourseSession` 被呼叫但 approved 學員數 < 1 或教材未全部收件
- **THEN** action 回傳 `success: false` 與具體原因，課程狀態不變

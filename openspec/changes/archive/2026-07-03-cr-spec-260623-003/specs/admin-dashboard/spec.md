# admin-dashboard Delta（cr-spec-260623-003）

## MODIFIED Requirements

### Requirement: 統計數據卡片
儀錶板統計 SHALL 以三個帶標題的區塊呈現：**學員分析**、**講師分析**、**課程分析**。

**學員分析**（包含講師）SHALL 顯示：
1. **學員總數**：系統中所有 User 總數
2. **各教會的會員總數**：以 **Top 5／Low 5 兩張圓餅圖**呈現（shadcn chart／recharts，client 元件）——Top 5 為人數最多的前五間教會、Low 5 為其餘教會中人數最少的五間（教會總數 ≤ 5 時不顯示 Low 5 圖）；計數方式為 `churchType = church` 依 `churchId` 分組（僅計人數 > 0 的教會）；每張圖 SHALL 具備數值標籤、hover tooltip 與圖例；「其他（自填）」（`churchType = other`）與「未填」（`churchType = none`）人數 SHALL 於 Top 5 卡片註記顯示
3. **近期活躍學員數（7 天內登入）**：`lastLoginAt` 在當下往前 7 天內的 User 數
4. **會員性別**：以圓餅圖呈現 `gender` 分布（男／女／未設定三片，含數值標籤、tooltip 與圖例）
5. **各年齡會員人數**：以柱狀圖呈現年齡分布——年齡＝當年減 `birthYear`，分組為「20 歲以下、21–30、31–40、41–50、51–60、61–70、71 歲以上」固定七組（含 0 人組距，附 tooltip）；`birthYear` 未填人數 SHALL 於卡片註記顯示、不列入柱狀

**講師分析** SHALL 顯示：
1. **啟動講師**：roles 含 `teacher_1` 的 User 數
2. **豐盛講師**：roles 含 `teacher_2` 的 User 數
3. **得勝講師**：roles 含 `teacher_3` 的 User 數

**課程分析** SHALL 顯示（四狀態互斥，總和＝課程總數）：
1. **招募中課程總數**：`startedAt IS NULL AND cancelledAt IS NULL AND completedAt IS NULL` 的 CourseInvite 數（卡片標籤 SHALL 為「招募中課程總數」，不得再使用「開課中」）
2. **進行中課程總數**：`startedAt IS NOT NULL AND cancelledAt IS NULL AND completedAt IS NULL` 的 CourseInvite 數
3. **已結業課程總數**：`completedAt IS NOT NULL AND cancelledAt IS NULL` 的 CourseInvite 數
4. **已放棄課程總數**：`cancelledAt IS NOT NULL` 的 CourseInvite 數

#### Scenario: 三區塊顯示統計
- **WHEN** 管理者進入儀錶板
- **THEN** 頁面依「學員分析／講師分析／課程分析」三個區塊分別顯示上述統計，數值為最新計算結果

#### Scenario: 教會分布 Top 5／Low 5 圓餅圖
- **WHEN** 有 6 間以上教會有會員、部分會員自填其他、部分未填
- **THEN** 學員分析區塊顯示 Top 5（人數最多前五間）與 Low 5（其餘中最少五間）兩張圓餅圖，各含數值標籤、tooltip 與圖例；「其他（自填）」「未填」人數註記於 Top 5 卡片

#### Scenario: 會員性別圓餅圖
- **WHEN** 系統中有男性、女性與未設定性別的會員
- **THEN** 學員分析區塊的性別圓餅圖以三片呈現各性別人數，含數值標籤、tooltip 與圖例

#### Scenario: 年齡分布柱狀圖與未填註記
- **WHEN** 部分會員填有 `birthYear`、部分未填
- **THEN** 柱狀圖依七個年齡組距顯示已填會員的分布，未填人數顯示於卡片註記、不佔柱狀

#### Scenario: 教會數不足時只顯示 Top 5
- **WHEN** 有會員的教會總數 ≤ 5
- **THEN** 僅顯示 Top 5 圓餅圖，不顯示 Low 5 卡片

#### Scenario: 近期活躍口徑為七天內登入
- **WHEN** 某會員 `lastLoginAt` 為 6 天前，另一會員為 8 天前
- **THEN** 近期活躍學員數計入前者、不計入後者

#### Scenario: 講師依身分計數
- **WHEN** 某使用者 roles 含 `teacher_2` 但不含 `teacher_1`
- **THEN** 該使用者計入「豐盛講師」、不計入「啟動講師」

#### Scenario: 已放棄課程計數
- **WHEN** 某課程 `cancelledAt` 非空（無論其他旗標）
- **THEN** 該課程計入「已放棄課程總數」，不計入招募中／進行中／已結業

#### Scenario: 招募中取代開課中
- **WHEN** 管理者檢視課程分析區塊
- **THEN** 未開始且未取消未結業的課程卡片標籤顯示「招募中課程總數」

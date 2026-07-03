# cr-spec-260623-003 Design：後台儀錶板分區塊統計

## Context

後台儀錶板（`app/[locale]/(admin)/admin/dashboard/page.tsx`）目前以單一 grid 平鋪 7 張 `StatCard`，數據來自 `lib/data/dashboard.ts` 的 `getDashboardStats()`（`Promise.all` 7 個 count）。可用欄位：

- 教會：`User.churchType`（church/other/none）＋ `churchId` → `Church`（`name`、`isActive`、`sortOrder`）、`churchOther` 自填文字。
- 活躍：`User.lastLoginAt`（登入時更新，見 login-activity-tracking）。
- 課程狀態旗標：`CourseInvite.startedAt / cancelledAt / completedAt`（已取消 > 已結業 > 進行中 > 招生中的推導慣例）。

後台頁面依 i18n 規範維持繁體硬寫，不走 messages。守衛由 `(admin)/layout.tsx` 統一處理，頁面不重複判定。

## Goals / Non-Goals

**Goals:**
- 統計改為「學員分析／講師分析／課程分析」三個帶標題的區塊。
- 新增：各教會會員總數、近期活躍學員數（7 天）、已放棄課程總數。
- 「開課中課程總數」更名「招募中課程總數」；講師卡標籤簡化為「啟動講師／豐盛講師／得勝講師」。

**Non-Goals:**
- 不動功能卡（動態待辦副標題）區塊。
- 不統一他處「招生中」用語（課程清單篩選、`status.recruiting`）。
- 不做時間區間切換、趨勢圖等進階分析（純即時計數）。
- 無 schema 變更、不加索引（後台低頻頁，count 足夠快）。

## Decisions

### D1：版面——三個 `<section>`，各自標題＋grid；教會分布用 Top 5／Low 5 圓餅圖
學員／講師／課程三區塊各為 `<section>`（`h2` 小標＋`StatCard` grid）。**各教會會員總數不逐教會出卡**（教會數量不定，卡片會爆版面），改為學員分析區塊內 **Top 5／Low 5 兩張圓餅圖卡**（需求方指定 shadcn chart 的 pie-with-label 模式）：Top 5 取分布前五、Low 5 取「前五以外」中人數最少五間（教會 ≤ 5 間時不顯示 Low 5）；「其他（自填）」「未填」以 Top 5 卡 footer 註記，不混入圓餅（非教會實體）。

- 元件：新增 client 元件 `app/[locale]/(admin)/admin/dashboard/church-distribution-charts.tsx`（colocate，比照 course-sessions-filter 慣例）；頁面維持 server component 傳資料。
- 相依：`npx shadcn add card chart`（新增 `components/ui/card.tsx`、`components/ui/chart.tsx`；recharts 專案已有）。
- 每張圖具數值標籤（pie `label`）、hover tooltip（`ChartTooltip`）與圖例（`ChartLegend`，教會名不靠顏色單獨傳達）。
- 替代方案：清單卡（初版設計）——需求方後改指定圓餅圖；長條圖對量值比較更precise，但尊重需求方指定形式，以標籤＋tooltip 補足讀值。

### D1a：`--chart-1..5` 改用通過驗證的色盤
shadcn 預設 chart tokens 經 `validate_palette` 檢驗 **不通過**（相鄰 CVD ΔE 6.0、近灰、對比不足）。專案尚無其他圖表使用這些 token，直接於 `app/globals.css` 以已驗證色盤取代（light/dark 各自選定、slot 順序即 CVD 安全機制不可重排）：light `#2a78d6/#1baf7a/#eda100/#008300/#4a3aa7`（worst ΔE 24.2）、dark `#3987e5/#199e70/#c98500/#008300/#9085e9`（worst ΔE 10.3，floor band 以直接標籤補償）；light 兩色對比 WARN 依 relief 規則由數值標籤＋圖例承擔。

### D1b：性別圓餅圖＋年齡柱狀圖（需求追加）
學員分析追加兩張圖卡（同為 colocated client 元件，`member-demographics-charts.tsx`）：

- **會員性別**：pie（同 D1 模式），三片固定 slot 順序 男=chart-1／女=chart-2／未設定=chart-3（顏色跟實體、不跟數量排名）；標籤沿後台慣例「男／女／未設定」。
- **各年齡會員人數**：單一序列 bar chart（shadcn ChartContainer＋recharts `BarChart`，`accessibilityLayer`），色用 chart-1；年齡＝當年 − `birthYear`（近似值，無月日資料），固定七組距「20 歲以下、21–30、…、61–70、71 歲以上」（含 0 人組距維持軸連續）；`birthYear` 未填者不入柱狀、於卡片註記人數（口徑同教會卡的其他/未填處理）。單一序列不設圖例（標題即名稱），保留 tooltip。
- Data layer：`groupBy(gender)`、`groupBy(birthYear)`（非 null）＋未填 count，組距換算在 data layer 完成，元件只管呈現。

### D2：教會計數查詢——`groupBy(churchId)` ＋ churchType 計數
`prisma.user.groupBy({ by: ['churchId'], _count: true, where: { churchType: 'church' } })` 後以 `Church` 名稱對照（一次 `findMany` 取 id→name）；`churchType: 'other'` 與 `'none'` 各一個 count 歸入「其他（自填）」「未填」。只列出有會員的教會（count > 0），不列 0 人教會。

- 替代方案：從 `Church.findMany({ include: { _count: { select: { users } } } })` 出發——會漏掉 other/none 歸類，且列出一堆 0 人教會沒有資訊量。
- `churchId` 有值但 `churchType ≠ church` 的邊角（理論上不存在）：以 churchType 為準，歸 other/none，不重複計數。

### D3：近期活躍學員數＝`lastLoginAt ≥ now − 7 天`
`prisma.user.count({ where: { lastLoginAt: { gte: sevenDaysAgo } } })`。以「登入」作為活躍代理指標（系統現有唯一活躍訊號），與後台「久未活動會員」功能的邏輯一致方向。標籤註明「（7 天內登入）」讓語意透明。

### D4：已放棄課程＝`cancelledAt` 非空
`prisma.courseInvite.count({ where: { cancelledAt: { not: null } } })`。與既有狀態推導（已取消優先）一致；招募中／進行中查詢維持現有旗標組合不變，四狀態互斥、總和等於課程總數。

### D5：`getDashboardStats()` 就地擴充，維持單函式 `Promise.all`
`DashboardStats` 型別加 `activeMembers7d`、`cancelledCourseSessions`、`churchDistribution: { name: string; count: number }[]`（含「其他（自填）」「未填」兩列，或以獨立欄位回傳由頁面組列——採獨立欄位 `otherChurchCount` / `noChurchCount`，顯示層自行拼列，語意最清楚）。不拆多函式——儀錶板一頁一次取用，單函式一趟 `Promise.all` 最簡單。

### D6：標籤更名僅限儀錶板，繁體硬寫
「招募中課程總數」「啟動講師／豐盛講師／得勝講師」直接改字串；後台不走 i18n（規範）。`lib/data/dashboard.ts` 內部變數名 `recruitingCourseSessions` 本來就叫 recruiting，不需改名。

## Risks / Trade-offs

- [教會清單很長時卡片變高] → 清單卡限制高度＋可捲動（`max-h` + `overflow-y-auto`）；上線初期教會數有限，可接受。
- [`lastLoginAt` 無法反映「登入後沒使用」的殭屍活躍] → 已是系統唯一活躍訊號，標籤明示口徑（7 天內登入），不過度詮釋。
- [groupBy＋名稱對照兩趟查詢非原子] → 後台統計頁對一致性要求低，瞬間差異可忽略。

## Migration Plan

無 schema 變更、無資料遷移。部署即生效；回滾即還原程式碼。

## Open Questions

（無——區塊、指標與口徑已由需求方列明；活躍口徑（7 天內登入）與已放棄口徑（cancelledAt）如需調整可於 apply 前提出。）

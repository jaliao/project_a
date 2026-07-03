# cr-spec-260623-003 Tasks：後台儀錶板分區塊統計

## 1. Data Layer

- [x] 1.1 `lib/data/dashboard.ts`：`DashboardStats` 型別擴充——新增 `activeMembers7d`、`cancelledCourseSessions`、`churchDistribution: { name: string; count: number }[]`、`otherChurchCount`、`noChurchCount`
- [x] 1.2 同檔 `getDashboardStats()`：新增查詢——近期活躍（`lastLoginAt ≥ now − 7d`）、已放棄（`cancelledAt ≠ null`）、教會分布（`groupBy(churchId)` where `churchType=church` ＋ `Church.findMany` 名稱對照，人數多到少、僅留 count > 0）、`churchType=other`／`none` 計數；已結業查詢補 `cancelledAt: null` 使四狀態互斥

## 2. 儀錶板頁面

- [x] 2.1 `app/[locale]/(admin)/admin/dashboard/page.tsx`：統計改為三個 `<section>`（學員分析／講師分析／課程分析，`h2` 小標＋grid）；講師卡標籤改「啟動講師／豐盛講師／得勝講師」；課程區塊四卡含新「已放棄課程總數」、「開課中課程總數」改「招募中課程總數」
- [x] 2.2 同檔：學員分析區塊新增「各教會的會員總數」跨欄清單卡（教會名＋人數、多到少排序，附「其他（自填）」「未填」列；`max-h` ＋ `overflow-y-auto` 防過長）與「近期活躍學員數（7 天內登入）」卡

## 2b. 教會分布改 Top 5／Low 5 圓餅圖（需求修訂）

- [x] 2.3 `npx shadcn add card chart`（新增 `components/ui/card.tsx`、`components/ui/chart.tsx`）；`app/globals.css` 的 `--chart-1..5` 換為通過 validate_palette 之色盤（light/dark，見 design D1a）
- [x] 2.4 新增 client 元件 `app/[locale]/(admin)/admin/dashboard/church-distribution-charts.tsx`：Top 5／Low 5 兩張圓餅圖卡（pie label＋tooltip＋legend；教會 ≤ 5 間時不顯示 Low 5；「其他（自填）」「未填」註記於 Top 5 卡 footer），取代清單卡並接上 page.tsx

## 2c. 學員分析追加：性別圓餅圖＋年齡柱狀圖（需求追加）

- [x] 2.5 `lib/data/dashboard.ts`：`DashboardStats` 加 `genderCounts {male,female,unspecified}`、`ageDistribution: {bucket,count}[]`（固定七組距，年齡＝當年−`birthYear`）、`noBirthYearCount`；查詢用 `groupBy(gender)`／`groupBy(birthYear)`＋null count
- [x] 2.6 新增 client 元件 `app/[locale]/(admin)/admin/dashboard/member-demographics-charts.tsx`：性別 pie（男/女/未設定，label＋tooltip＋legend）＋年齡 bar（單序列 chart-1、七組距、tooltip、未填人數註記），接上 page.tsx 學員分析區塊；同步手冊與 README-AI

## 3. 文件與版號

- [x] 3.1 更新 `doc/管理者操作手冊.md` 儀錶板統計章節（三區塊、各指標口徑、「招募中」用語）＋檔首版號日期；`doc/老師手冊.md`／`doc/學員手冊.md` 檢查無涉及則不動
- [x] 3.2 `config/version.json` patch +1；依 `.ai-rules.md` 更新 `README-AI.md`（版號＋本次變更摘要）

## 4. 驗證

- [x] 4.1 `npm run lint` 與 `npm run build` 通過
- [ ] 4.2 手動驗證：儀錶板三區塊與各卡數值正確（教會分布含其他/未填、活躍 7 天口徑、已放棄計數、招募中標籤），功能卡區塊不受影響

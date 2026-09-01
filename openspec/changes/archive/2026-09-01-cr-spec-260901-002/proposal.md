## Why

需求單 CR-SPEC-260901-002（提出人：廖柏嘉 Justin，2026-09-01）：**「請協助做月報」**。原文：

> 請協助做月報
> 參考 `doc/啟動8月月報.pdf`
> 把月報資訊做在儀表板裡面
> 可以切換看不同月份

`doc/啟動8月月報.pdf`（啟動事工 2026 年 8 月月報）內含四塊資訊：

1. **總體分析**：第一冊（啟動靈人）／第二冊（啟動豐盛）參與課程「累計總人數」、與上月比較的淨增人數與成長率、第一冊→第二冊「已開課單位整體轉換率」。
2. **世代倍增發展追蹤**：教師依「世代」（第一代～第五代）分布與總數。
3. **第一冊各單位發展狀況**：總人數／月成長率／淨增人數三張卡片，＋逐單位（教會／組織）表格：累計總人數、月成長人數、人數佔比、增加組數。
4. **第二冊各單位發展狀況**：總人數／成長率／轉換率卡片，＋逐「已開課單位」表格：累計總人數、月成長人數、增加組數、佔該單位第一冊人數比、整體轉換率。

目前後台 `/admin/dashboard`（`admin-dashboard` capability）只有「學員分析／講師分析／課程分析」三個**即時快照**區塊，沒有任何「按月」「跨月比較」的呈現。本 CR 在同一頁新增「月報」區塊，所有數字**即時由既有時間戳（`InviteEnrollment.joinedAt` / `graduatedAt`、`CourseInvite.createdAt` / `startedAt`）推導**，並提供月份下拉切換不同月份。

使用者澄清（2026-09-01）：

- **呈現位置**：儀表板內新增區塊（不另開子頁）。
- **世代資料來源**：由系統師生鏈推導（啟動靈人 `CourseInvite.createdBy` ↔ 已結業 `InviteEnrollment` 的傳承鏈），系統無「世代」欄位。
- **計算口徑**：即時由時間戳推導，不另存每月快照。
- **單位定義**：對應 `Church` 資料表逐間（另彙總「其他／未填」）。

## What Changes

### 1. 資料層：`lib/data/monthly-report.ts`（新檔）

新增 `getMonthlyReport(month?: string)` 與 `getAvailableReportMonths()` 兩支查詢函式，回傳結構化月報資料（型別 `MonthlyReport`）。

- **課程對應**：第一冊＝`courseCatalogId = 1`（啟動靈人）、第二冊＝`courseCatalogId = 2`（啟動豐盛），以模組常數 `BOOK1_CATALOG_ID` / `BOOK2_CATALOG_ID` 表示。
- **月份與邊界**：`month` 格式 `YYYY-MM`（以 `Asia/Taipei` 民用月為準）。
  - `asOfEnd`＝所選月「下個月 1 日 00:00（Asia/Taipei）」——「累計至本月底」的排除上界。
  - `asOfPrevEnd`＝所選月「1 日 00:00（Asia/Taipei）」——「累計至上月底」。
  - `month` 省略／不合法 → 取「上一個完整月份」（今天所在月的前一個月）。
- **累計參與人數**：某冊「累計至 T」＝`InviteEnrollment` 中 `invite.courseCatalogId` 為該冊、`status = 'approved'`、`joinedAt < T` 的**去重 `userId` 數**。
  - 月成長人數＝`累計至 asOfEnd − 累計至 asOfPrevEnd`。
  - 月成長率＝`月成長人數 ÷ 累計至 asOfPrevEnd`（分母 0 → 回傳 `null`，UI 顯示「—」）。
- **單位（Church）歸屬**：
  - 「人數」歸屬＝該參與者**目前**的 `User.church`（`churchType = 'church'` 取 `churchId`），`churchType` 為 `other` / `none` 者彙總為單一「其他／未填」列。（`User` 無教會異動歷史，採現況歸屬，為已知限制。）
  - 「組數」歸屬＝該 `CourseInvite` 建立者（`createdBy`）目前的 `User.church`，同上彙總。
  - 逐單位累計人數／月成長人數＝上述累計人數規則再依單位分組。
  - 人數佔比＝`單位累計人數 ÷ 該冊全體累計人數`。
- **增加組數**：某冊某單位「本月增加組數」＝`CourseInvite` 中 `courseCatalogId` 為該冊、`createdAt ∈ [asOfPrevEnd, asOfEnd)`、建立者單位為該單位的筆數。
- **已開課單位（第二冊）**：曾有第二冊 `CourseInvite` 且 `startedAt != null AND startedAt < asOfEnd`，依建立者單位取集合。
- **里程碑轉換率**：`第二冊累計至 asOfEnd ÷ 第一冊累計至 asOfEnd 中「單位屬於第二冊已開課單位」的去重人數`（對應 PDF「172 ÷ 1072」）。
- **逐單位第二冊轉換率**：該單位第二冊累計 ÷ **同一單位**第一冊累計（對應 PDF「137/817」）。
- **世代倍增**：
  - 教師集合 `T(asOfEnd)`＝所有「在啟動靈人（`courseCatalogId = 1`）帶領並使人結業」的建立者——即 `CourseInvite`（`courseCatalogId = 1`）之 `createdById`，且該課至少一筆 `InviteEnrollment.graduatedAt != null AND graduatedAt < asOfEnd`。
  - `mentor(t)`＝ `t` 在啟動靈人**最早結業**（`graduatedAt < asOfEnd`）那筆 `InviteEnrollment` 對應 `invite.createdBy`（沿用 `lib/data/hierarchy.ts` 老師判定邏輯）。
  - `generation(t)`：`mentor(t)` 為 null 或不在 `T(asOfEnd)` → 第 1 代；否則 `generation(mentor(t)) + 1`。內建環路防護（重訪則視為第 1 代）與深度上限。
  - 輸出各代（第 1…N 代，N 依實際資料）人數與教師總數 `|T(asOfEnd)|`。
  - 因 `roles` 無取得時間戳，世代區塊同樣以「結業時間」為月份界線，切換月份會連動。
- **可選月份清單**：自最早 `InviteEnrollment.joinedAt` 所在月至今日所在月（`Asia/Taipei`），由新到舊。

### 2. UI：`/admin/dashboard` 新增「月報」區塊

- `app/[locale]/(admin)/admin/dashboard/page.tsx`：
  - 讀 `searchParams.month`，呼叫 `getMonthlyReport(month)` 與 `getAvailableReportMonths()`。
  - 於「課程分析」區塊之後新增 `<section>`「月報」，內含月份切換與四個子區塊。
- 新檔 `app/[locale]/(admin)/admin/dashboard/monthly-report-section.tsx`（可含 client 子元件）：
  - **月份切換**：`<MonthSelect>` client 元件，`<select>` 列出可選月份（顯示如「2026 年 8 月」），值綁 `?month=`；變更時以 locale-aware `router` 導向同頁帶新參數（`@/i18n/navigation`）。
  - **總體分析**：三張延伸統計卡——第一冊累計（＋月成長人數、月成長率）、第二冊累計（＋月成長人數、月成長率）、里程碑轉換率（＋「分子 ÷ 分母」說明）；另以說明列出本月成長最多的單位（第一冊前二、第二冊第一，依月成長人數）。
  - **世代倍增**：「共 N 位教師」＋每代一列（第 1…N 代）人數（水平長條或清單）。
  - **第一冊各單位**：表格欄「單位／累計總人數／月成長人數／人數佔比（含長條）／增加組數」，依累計人數由多至少。
  - **第二冊各單位**：表格欄「單位（限已開課）／累計總人數／月成長人數／增加組數／佔該單位第一冊比」，附「總計」列與整體轉換率。
  - 文字一律**繁體硬字串**（比照現有後台儀表板與 CLAUDE.md 第 12 點「後台與其專屬字串本階段維持繁體」）；圖表沿用既有 `recharts` + `components/ui/chart`。
- `export const dynamic = 'force-dynamic'` 已存在，維持。

### 3. 文件與版本號（`/opsx:apply` 時）

- `doc/管理者操作手冊.md`：儀表板章節新增「月報」小節（四子區塊、月份切換、各數字口徑摘要）；更新檔首版本與日期。`doc/老師手冊.md`／`doc/學員手冊.md` **不涉及**（純後台）。
- `config/version.json`：patch +1、`updatedAt` 改當日。
- `ai-context/03-architecture.md`：`lib/data/` 補 `monthly-report.ts`、`/admin/dashboard` 說明補月報區塊；`ai-context/07-current-tasks.md` 追加本 CR；`README-AI.md` 版本行同步。

## Capabilities

### Added Capabilities

- `admin-dashboard-monthly-report`：`/admin/dashboard` 新增「月報」區塊，含月份下拉切換，呈現四子區塊——(1) 總體分析（第一冊／第二冊累計參與人數、月成長人數與成長率、里程碑轉換率）、(2) 世代倍增（教師依師生鏈推導之世代分布與總數）、(3) 第一冊各單位（逐 `Church` 累計人數、月成長、人數佔比、增加組數）、(4) 第二冊各單位（限已開課單位，逐單位累計、月成長、增加組數、佔該單位第一冊比與整體轉換率）。所有數字即時由 `InviteEnrollment` / `CourseInvite` 時間戳推導，不另存快照；僅 admin/superadmin 可見（沿用 `(admin)` 群組守衛）。

## Impact

- **Affected code**：
  - 新增：`lib/data/monthly-report.ts`、`app/[locale]/(admin)/admin/dashboard/monthly-report-section.tsx`
  - 修改：`app/[locale]/(admin)/admin/dashboard/page.tsx`（加月報區塊、讀 `searchParams`）、`doc/管理者操作手冊.md`、`config/version.json`、`ai-context/03-architecture.md`、`ai-context/07-current-tasks.md`、`README-AI.md`
  - 不變：Prisma schema、所有 server action、其餘資料層、`admin-dashboard` 既有三區塊
- **Database**：**無 schema 變更**——純讀取／推導查詢，不新增快照表。
- **既有資料**：不涉及；純彙總呈現。
- **UI / 行為**：`/admin/dashboard` 頁面尾端多一個「月報」區塊與 `?month=YYYY-MM` 查詢參數；無新頁面、無路由群組變更、無權限變更。
- **Route access**：區塊位於 `(admin)` 群組，由既有 middleware／`(admin)/layout.tsx` 守衛涵蓋，**不需**登錄 `lib/auth/route-access.ts`。
- **i18n**：後台維持繁體硬字串（CLAUDE.md 第 12 點），不新增 i18n key。
- **Dependencies**：無新增套件（`recharts`、`xlsx` 等皆已存在，本 CR 僅用到既有 chart 元件）。
- **效能**：月報查詢含多次 `groupBy` 與兩個時間點的去重計數，屬 admin 單頁載入，`force-dynamic` 每次重算；世代鏈以單次查詢載入啟動靈人結業紀錄後於記憶體建圖。可接受。

## Open Questions

以下為與「人工製作的 PDF」對帳時的細節，採合理預設，spec-review 時可再調整，不阻擋產出：

1. **「增加組數」的口徑**：預設為「該月 `CourseInvite.createdAt` 落點」。若事工實際定義為「該月 `startedAt`（開課）落點」，改一個條件即可。
2. **單位歸屬採「現況」**：`User` / `CourseInvite.createdBy` 目前的 `church`，非歷史歸屬（系統無教會異動歷史）。跨月回看時，歸屬以現況為準。
3. **教師集合定義**：採「在啟動靈人帶領並使人結業者」而非「持有 `teacher_*` role 者」，因 role 無取得時間戳、無法按月界定；兩者數量可能與 PDF 的 282 略有出入。

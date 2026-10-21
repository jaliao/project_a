## 1. 資料層

- [x] 1.1 `lib/data/monthly-report.ts` 新增 `generationTeacherDetails(end: Date): Promise<GenerationTeacherDetail[]>`：
  - 重用 `generations()` 的查詢條件與推導邏輯（`teacherSet`、`mentorOf`、`gen()` 遞迴＋ memo、環路防護、`MAX_GEN` 上限），不修改既有 `generations()`。
  - 額外查詢教師與導師的顯示用姓名/啟動編號（`User.spiritId`／`realName`）。
  - 回傳型別：
    ```ts
    export type GenerationTeacherDetail = {
      teacherId: string
      teacherLabel: string // spiritId 或 realName，皆無則顯示 userId
      generation: number
      mentorId: string | null
      mentorLabel: string | null // 無 mentor 時為 null
      mentorGeneration: number | null
      earliestGraduatedAt: Date // 該教師最早帶出一人結業的時間（計入教師集合的依據）
    }
    ```
  - 依 `generation` 由小到大、同代別依 `earliestGraduatedAt` 由早到晚排序。

## 2. 匯出端點

- [x] 2.1 新檔 `app/api/admin/dashboard/generations/export/route.ts`（比照 `app/api/admin/members/export/route.ts`）：
  - `GET`，驗證 `auth()` + `canAccessAdmin(session.user.roles)`，未通過回 401。
  - 讀取查詢參數 `month`（`YYYY-MM`），驗證格式；不合法或缺省時比照 `monthly-report.ts` 的 `normalizeMonth` 邏輯退回上一個完整月份。
  - 呼叫 `taipeiMonthBounds(month)` 取得 `end`，呼叫 `generationTeacherDetails(end)`。
  - 組 xlsx 資料列（欄位：教師啟動編號/姓名、代別、導師啟動編號/姓名、導師代別、最早帶出一人結業時間），無 mentor 時「導師」「導師代別」欄位填 `'—'`。
  - `XLSX.utils.json_to_sheet` + `book_append_sheet`（sheet 名稱「世代明細」）+ `Content-Disposition: attachment; filename="generations-<month>.xlsx"`。

## 3. 前端按鈕與說明對話框

- [x] 3.1 `app/[locale]/(admin)/admin/dashboard/monthly-report-section.tsx`：「世代倍增」子區塊標題列新增：
  - 「下載 raw data」連結按鈕：`<a href={`/api/admin/dashboard/generations/export?month=${report.month}`}>`，樣式比照頁面既有按鈕（`Button` + `variant="outline"` 或等同既有按鈕樣式）。
  - 「說明」按鈕：開啟 `Dialog`（`components/ui/dialog.tsx`），內容為靜態說明文字（依 delta spec 的「世代倍增數據定義說明」Requirement 四點撰寫白話版本）。
  - 需要 `'use client'`（已是 client component）管理 Dialog 開關狀態（`useState`）。

## 4. 操作手冊與版本號

- [x] 4.1 `doc/管理者操作手冊.md`：「世代倍增發展追蹤」段落補充「下載 raw data」與「說明」按鈕的用途與操作方式。
- [x] 4.2 `config/version.json` patch +1，`updatedAt` 更新為當日日期；同步更新手冊檔首版本標註。

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 與 `npm run build` 皆成功。
- [x] 5.2 情境：切換到本機 dev 資料庫既有資料所在月份 → 下載的 Excel 依代別分組計數，與畫面各代人數一致。（以本機 dev DB 2026-08/2026-09 實測：`generationTeacherDetails()` 明細依代別分組計數與 `generations()` 彙總 buckets 完全一致，PASS）
- [x] 5.3 情境：某教師無 mentor（種子教師）→ 下載明細該列導師欄位顯示「—」。（實測兩個月份皆有 3 位無 mentor 教師，皆正確計為第 1 代，PASS；路由層對應輸出「—」，見 route.ts 實作）
- [x] 5.4 情境：切換頁面月份後再下載 → 下載內容對應新選的月份，不是上次月份的資料。（實測 2026-08 教師總數 150、2026-09 為 166，名單隨月份變動，PASS）
- [x] 5.5 情境：未登入或非 admin/superadmin 直接呼叫匯出網址 → 回應未授權。（對本機 dev server 實際發送無 cookie 請求，回應 401 Unauthorized，PASS）
- [x] 5.6 情境：點擊「說明」按鈕 → 對話框開啟顯示說明文字；關閉後不影響子區塊既有畫面。（本環境無瀏覽器工具可用，以靜態程式碼複查確認：`Dialog open/onOpenChange` 為受控狀態、按鈕 `onClick` 正確切換 `open`，符合 Radix 受控 Dialog 標準寫法；建議人工於瀏覽器做一次目視確認）

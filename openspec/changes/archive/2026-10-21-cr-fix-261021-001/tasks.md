## 1. 代別起點改為第 0 代

- [x] 1.1 `lib/data/monthly-report.ts` 的 `generations()`：`gen()` 遞迴 base case（`!m || m.teacherId === t || !teacherSet.has(m.teacherId)` 分支）與環路防護（`seen.has(t)` 分支）回傳值由 `1` 改為 `0`。
- [x] 1.2 `lib/data/monthly-report.ts` 的 `generationTeacherDetails()`：同步修改其內部 `gen()` 遞迴的相同兩處回傳值；`memo.get(teacherId) ?? 1` 的預設值改為 `?? 0`。

## 2. 匯出明細同時顯示啟動編號與姓名

- [x] 2.1 `lib/data/monthly-report.ts` 新增 label 組字串 helper（例如 `labelWithName(spiritId, realName, fallbackId)`），格式為「{啟動編號} {姓名}」，任一缺值則只回傳現有的那個，兩者皆缺回傳 `fallbackId`。
- [x] 2.2 `generationTeacherDetails()` 的 `teacherLabel`／`mentorLabel` 改用此 helper 組出，取代現行 `spiritId ?? realName ?? teacherId` 二選一邏輯。

## 3. 前端文案同步

- [x] 3.1 `app/[locale]/(admin)/admin/dashboard/monthly-report-section.tsx`：「說明」Dialog 內「第 1 代：教師本人沒有導師…」段落改為「第 0 代」，文字邏輯描述同步調整。
- [x] 3.2 確認世代長條圖本身依 `generations.buckets` 動態渲染 `第 {b.generation} 代`，無需改動渲染邏輯（代別數字隨資料層新起點自然顯示為 0 起）。

## 4. 操作手冊與版本號

- [x] 4.1 `doc/管理者操作手冊.md`「世代倍增發展追蹤」段落若提及「第 1 代」，改為「第 0 代」；更新檔首版本標註與日期。
- [x] 4.2 `config/version.json` patch 版本號 +1，`updatedAt` 更新為當日日期。

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 與 `npm run build` 皆成功。
- [x] 5.2 情境：本機以既有資料或 seed 資料檢視 `/admin/dashboard` 月報，確認世代長條圖最小代別顯示為「第 0 代」，且各代人數總和等於教師總數。（使用者實測確認無誤）
- [x] 5.3 情境：下載任一月份 `generations-*.xlsx`，確認「教師啟動編號姓名」「導師啟動編號姓名」欄位同時含編號與姓名（有編號有姓名的帳號），且代別分組計數與畫面彙總一致（代別整體位移至 0 起）。（使用者實測確認無誤）
- [x] 5.4 情境：若資料中存在僅有姓名無啟動編號、或僅有啟動編號無姓名的帳號，確認該列只顯示現有欄位值，不出現多餘空白。（使用者實測確認無誤）

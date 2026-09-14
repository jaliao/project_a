## Why

結業表單（`/course/[id]/graduate`）目前送出結業後只顯示一則簡短成功 toast 就直接導回課程詳情頁，講師不清楚後續會發生什麼事。實際上系統已具備「待製作證書清單」（`admin-certificate-production`）流程，已結業學員會自動出現在該清單等待管理者製作實體證書。講師送出結業當下應該被明確告知「接下來會為學員製作證書」，讓大家知道結業與證書製作是銜接在一起的流程，而不是誤以為結業後就結束、沒有下文。

## What Changes

- 結業表單「送出結業」步驟成功送出後，若本次結業結果含至少一位已結業學員，SHALL 於結業頁顯示提示對話框「將會為您製作證書」，說明系統將接續為已結業學員進行結業證書的製作；講師需點擊確認後，才導回課程詳情頁。
- 若本次結業結果沒有任何已結業學員（全員標記未結業），維持原有行為：僅顯示成功提示並直接導回課程詳情頁，不顯示證書提示對話框（沒有學員結業就不會有證書要製作，此提示不適用）。
- 連帶調整：結業頁 `completedAt` 已設時不再以伺服器端強制導離，改顯示「此課程已結業」訊息（見 Impact／design.md 說明原因）。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `course-graduation-page`：「送出結業」需求新增——成功送出且有已結業學員時，於結業頁顯示「將會為您製作證書」提示對話框，確認後才導回課程詳情頁；無已結業學員時行為不變。「結業表單頁面入口」需求的「課程已結業時存取」情境，由「強制導離」改為「顯示已結業訊息，不導離」

## Impact

- **UI**：`app/[locale]/(user)/course/[id]/graduate/page.tsx` 移除「已結業→導離」的伺服器端 `redirect()`，改傳 `alreadyCompleted` prop；`graduation-form.tsx` 以掛載當下鎖定的 `initiallyCompleted` 值決定顯示表單或「已結業」訊息，`handleSubmit` 成功分支依 `graduatedStudents.length > 0` 決定顯示提示對話框（不導頁，確認後才導頁）或維持原本 toast + 立即導頁。（詳見 design.md「最終定案」，記錄此前兩輪嘗試失敗的原因。）
- **i18n**：`messages/zh-TW.json`／`en.json` 的 `course.gradForm` 命名空間新增提示對話框與「已結業」訊息文案。
- **無 schema／server action 變更**（`graduateCourse` 結業寫入邏輯不變，純前端流程調整）。
- 不影響 `course-graduation`（結業業務邏輯）、`admin-certificate-production`（證書製作清單）既有行為。

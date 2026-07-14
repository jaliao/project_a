# cr-spec-260714-001 證書製作：姓名改連動真實姓名＋卡片呈現

## Why

實體結業證書上印的是學員**真實姓名**，但後台證書製作清單的「姓名」欄目前透過 `getMemberDisplayName()` 連動會員「顯示名稱」（暱稱優先），管理者看到的是對方暱稱，無法直接作為證書製作依據。另外清單目前為傳統表格呈現，欄位多達 9 欄，手機上需橫向捲動、操作不便（本專案為手機優先）。

## What Changes

- 證書製作清單同時呈現**「真實姓名」與「顯示名稱」兩個欄位**：真實姓名為證書製作依據（主要欄位），**中文（`realName`）與英文（`englishName`）並列**；顯示名稱作輔助辨識。真實姓名（中英文皆）未填時明確標示（如「未填」警示），提醒管理者需先補資料才能製作證書。
- 卡片加列**身分確認資訊**：性別（男/女/未指定）與單位（所屬教會：清單教會名／自填其他），幫助管理者確認是同一人、避免同名誤製。
- 人名搜尋同步改為以**真實姓名**為主要比對對象（並保留暱稱／啟動編號比對，方便管理者用任一名字找人）。
- 清單呈現由表格改為**卡片方式**：每張證書一張卡片，包含姓名、啟動編號、階層、結業日、狀態、製作日期／管理者、備註編輯與操作按鈕；行動裝置單欄、桌機可多欄。
- 篩選、分頁、標記完成／還原、備註等既有功能行為不變。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `admin-certificate-production`：
  - 「待製作證書清單」需求：同時顯示「真實姓名」（中英文並列，主要，未填時明確標示）與「顯示名稱」（輔助），並加列性別與單位等身分確認資訊；清單呈現方式改為卡片。
  - 「人名搜尋與分頁」需求：搜尋比對以真實姓名為主（保留顯示名稱與啟動編號比對）。

## Impact

- `lib/data/certificate.ts`：`CertificateListItem` 新增 `realName`、`englishName`、`gender`、單位（教會）欄位（查詢需加 select `gender`、`churchType`、`church.name`、`churchOther`）；搜尋過濾邏輯調整。
- `app/[locale]/(admin)/admin/certificates/page.tsx`：表格改為卡片版面（沿用 `CertificateNoteCell`、`CertificateProduceButton`）。
- `components/admin/certificate-cells.tsx`：視卡片版面需要微調（尺寸／排版），邏輯不變。
- 手冊：`doc/管理者操作手冊.md` 證書製作章節需同步更新（畫面與姓名說明）；`config/version.json` patch +1。
- 無資料庫 schema 變更、無 API 變更。

# cr-spec-260714-001 Design

## Context

後台證書製作頁（`app/[locale]/(admin)/admin/certificates/page.tsx`）目前以 9 欄表格列出待製作證書，姓名欄由 `lib/data/certificate.ts` 的 `getMemberDisplayName()` 產生——該規則**暱稱優先**，故顯示的是學員暱稱。實體證書須印真實姓名，管理者無法直接照清單製作。使用者已定案：**UI 同時顯示「顯示名稱」與「真實姓名（中文＋英文）」**，並加列**性別、單位（所屬教會）**等身分確認資訊，清單改為卡片呈現（本專案手機優先）。

系統未上線、無正式資料，不需相容既有資料；本變更無 schema、無 API 變更。

## Goals / Non-Goals

**Goals:**
- 清單每筆同時提供「真實姓名」（中文＋英文，證書製作依據）與「顯示名稱」（輔助辨識）。
- 提供性別、單位（所屬教會）等身分確認資訊，協助管理者確認同名者身分。
- 真實姓名（中英文皆）未填時給出醒目警示，避免製作出錯誤證書。
- 搜尋涵蓋真實姓名（中英文）、顯示名稱、啟動編號。
- 表格改為響應式卡片：手機單欄、桌機多欄，免橫向捲動。

**Non-Goals:**
- 不改變證書單位（人×階層去重）、狀態篩選、分頁、標記完成／還原、備註等既有行為。
- 不做後台 i18n（後台維持繁體，見 CLAUDE.md 第 12 點漸進遷移原則）。
- 不新增資料庫欄位或 API。

## Decisions

### D1. Data layer 新增身分欄位，保留 `displayName`

`CertificateListItem` 新增：

- `realName: string | null`、`englishName: string | null`（取自 `User`）
- `gender: 'male' | 'female' | 'unspecified'`
- `churchLabel: string | null`（單位：`church.name ?? churchOther ?? null`，比照會員匯出 `formatChurch` 的解析順序；查詢加 select `gender`、`churchType`、`churchId→church.name`、`churchOther`）

`displayName` 維持 `getMemberDisplayName()` 結果不變。

- 理由：兩欄並列與身分確認資訊是使用者定案；`displayName` 已被卡片與 `producedByName` 沿用，保留可最小化改動。單位解析沿用既有 `formatChurch` 邏輯，避免新發明規則。
- 替代方案（捨棄）：把 `displayName` 改成 realName——語意混淆，且失去暱稱辨識功能。

### D2. 卡片版面（取代表格）

每張證書一張卡片，資訊分層：

```
┌─────────────────────────────────────┐
│ 真實姓名中文 英文名(大字)  [狀態 Badge] │
│ 顯示名稱：xxx · 啟動編號(mono)         │
│ 性別 · 單位（所屬教會）                │
│ 階層 · 結業日 YYYY/MM/DD              │
│ （已完成時）製作：日期 · 管理者          │
│ ┌─ 備註 Textarea ─────────────────┐  │
│ └─────────────────────────────────┘  │
│             [已完成製作 / 還原] 按鈕   │
└─────────────────────────────────────┘
```

- 格線：`grid gap-4 md:grid-cols-2 xl:grid-cols-3`，手機單欄。
- 卡片用現有 `Card`（`components/ui/card.tsx`）或等效 `rounded-lg border` div，比照後台既有卡片風格。
- 主標題＝真實姓名：中文（`realName`）與英文（`englishName`）並列（如「王小明 Ming Wang」）；兩者皆未填時顯示紅色警示字樣「未填真實姓名」（`text-destructive`），僅缺其一則只列有填的那個。狀態 Badge 與操作按鈕照常。
- 顯示名稱以次要文字（`text-muted-foreground`）列於主標題下，與啟動編號同列。
- 身分確認列：性別（男/女/未指定，比照會員匯出 `formatGender` 標籤）＋單位 `churchLabel`（未填顯示「—」）。
- `CertificateNoteCell`、`CertificateProduceButton` 直接沿用，僅按需微調外距。

### D3. 搜尋比對範圍擴充

`q` 比對：`realName`、`englishName`（不分大小寫）、`displayName`、`spiritId`（後兩者為既有行為）。中文比對維持 `includes`；性別／單位不納入搜尋（非人名，避免雜訊）。

### D4. 排序與分頁不動

仍在 data layer 記憶體內過濾／排序／分頁（資料量小、既有模式），不改為 DB 查詢。

## Risks / Trade-offs

- [真實姓名未填的證書仍可標記完成] → 僅以警示提醒、不阻擋操作，管理者可能誤標。權衡：阻擋會妨礙特例流程（如管理者已另行確認姓名）；以醒目警示為主，不加硬性限制。
- [卡片比表格佔用更多垂直空間，桌機一頁可見筆數變少] → 桌機 2–3 欄格線緩解；每頁 30 筆與分頁不變。
- [記憶體內全表撈取（既有設計）] → 資料量為結業人次等級（小），維持現狀；未上線無效能疑慮。

## Migration Plan

無 schema／資料遷移。純前端＋data layer 顯示層變更，部署即生效；回滾即還原程式碼。

## Open Questions

（無——顯示欄位配置已由使用者定案。）

# cr-spec-260714-001 Tasks

## 1. Data Layer

- [x] 1.1 `lib/data/certificate.ts`：`CertificateListItem` 新增 `realName`、`englishName`、`gender`、`churchLabel`（查詢加 select `gender`、`churchType`、`church.name`、`churchOther`；`churchLabel` 比照會員匯出 `formatChurch` 取 `church.name ?? churchOther ?? null`；`displayName` 維持不變）
- [x] 1.2 `lib/data/certificate.ts`：人名搜尋比對範圍加入 `realName` 與 `englishName`（英文不分大小寫；保留 `displayName` 與 `spiritId` 比對）

## 2. 卡片 UI

- [x] 2.1 `app/[locale]/(admin)/admin/certificates/page.tsx`：移除表格，改為響應式卡片格線（`grid gap-4 md:grid-cols-2 xl:grid-cols-3`），每卡含：真實姓名中英並列（主標題，如「王小明 Ming Wang」，僅缺其一則只列有填者）、顯示名稱＋啟動編號（次要列）、性別＋單位（身分確認列，性別標籤男/女/未指定、單位未填顯示「—」）、階層＋結業日、狀態 Badge、已完成時的製作日期／管理者、備註（`CertificateNoteCell`）、操作按鈕（`CertificateProduceButton`）
- [x] 2.2 真實姓名中英文皆未填時卡片主標題顯示醒目警示「未填真實姓名」（`text-destructive`），操作不受阻擋
- [x] 2.3 視卡片版面需要微調 `components/admin/certificate-cells.tsx` 的外距／尺寸（邏輯不變）

## 3. 驗證

- [x] 3.1 `npm run lint` 與 `npm run build` 通過
- [x] 3.2 手動驗證：卡片同時顯示真實姓名（中英並列）與顯示名稱、性別與單位；以中文真實姓名或英文名稱關鍵字可搜到暱稱不同的學員；中英文皆未填者顯示警示、僅填其一者正常顯示；狀態篩選／分頁／標記完成／還原／備註行為不變；手機寬度單欄無橫向捲動

## 4. 文件與版本

- [x] 4.1 更新 `doc/管理者操作手冊.md` 證書製作章節（卡片畫面、真實姓名中英並列／顯示名稱說明、性別與單位身分確認資訊、未填警示），並更新檔首版本標註與日期
- [x] 4.2 `config/version.json` patch +1 並更新 `updatedAt`（依規範於 /opsx:apply 時執行）
- [x] 4.3 依 `.ai-rules.md` 重新產生 `README-AI.md`（依規範於 /opsx:apply 時執行）

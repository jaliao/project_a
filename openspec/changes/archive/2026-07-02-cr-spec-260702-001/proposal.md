## Why

系統上線前需以既有名冊建立正確的啟動靈人／啟動豐盛結業狀態。手邊有兩份人工整理的啟動靈人證書名單（`doc/已領取-啟動靈人證書.docx`、`doc/待製作-啟動靈人證書.docx`）與一份啟動豐盛種子教師名單（`doc/啟動豐盛種子教師名單.xlsx`）。證書名單**不匯入證書製作**，而是作為「誰完成了啟動靈人」的判定依據；豐盛名單則用來建立豐盛種子班。過程中也修正了名冊解析的隱藏字元 bug（收容班誤判）。

## What Changes

- **名冊解析修正**：`build-roster.mjs` 新增 `cleanName()`，清除 Excel 姓名/編號中的隱藏字元（word joiner `U+2060` 等）再比對。原本 5 位老師因姓名被汙染而誤入黃國倫收容班；修正後收容班歸零（`unmatchedTeacherKeys = 0`）。
- **黃國倫啟動豐盛種子班**（`courseCatalogId = 2`）：依 `doc/啟動豐盛種子教師名單.xlsx`（65 人）建立，成員加上 **teacher_2（啟動豐盛講師）** 身分並標記結業；名單經比對名冊（`李素真` 已直接存在名冊、`黃宣志` 指定 B006）。
- **以證書名單判定啟動靈人結業**（**不建立 `CertificateProduction`**）：
  - 證書名單（已領取 ∪ 待製作，含簡→繁正規化）＝完成啟動靈人的學員。
  - 班級中若有 ≥1 位學員在名單 → 該班標記**課程結業**；名單內學員 → **已結業**（`graduatedAt`），其餘同班學員 → **未結業**（`nonGraduateReason = "other"`）。
  - 無任何名單學員的班級 → **不自動結業**。
- **結業日期**：
  - 黃國倫啟動靈人種子班 → **2025/03/08**
  - 其餘啟動靈人結業班級 → **2025/09/01**
- 產出審閱清單：`doc/啟動靈人結業班級清單.md`（自動結業班級 + 每位學員已/未結業 + 文末列出零結業班級）。

## Capabilities

### New Capabilities
- `prosperity-seed-class`: 依豐盛種子教師名單建立黃國倫啟動豐盛種子班（catalog 2），成員授予 teacher_2 並結業。
- `starter-graduation-import`: 以啟動靈人證書名單判定各班課程結業與學員結業/未結業狀態（不涉證書製作）。

### Modified Capabilities
<!-- 名冊解析（隱藏字元清理）與既有種子班/收容班/報名結業邏輯於 member-roster-seed 描述；實作時若改動既有報名結業規則，回填 delta。 -->

## Impact

- **資料/腳本**：
  - `prisma/seed-data/build-roster.mjs`（新增 `cleanName()`）、`prisma/seed-data/roster.json`（重新產生）。
  - `prisma/seed-data/build-prosperity-seed.mjs`（新）＋`prosperity-seed.json`（產物）。
  - `prisma/seed.ts`：新增豐盛種子班（§7c，已完成）；待新增以證書名單判定啟動靈人結業的邏輯與日期常數。
- **相依**：`opencc-js`、`xlsx`（皆已安裝）；docx 解析（zip + `word/document.xml`）。
- **資料模型**：`CourseInvite.completedAt`、`InviteEnrollment.graduatedAt` / `nonGraduateReason`、`User.roles`（加 teacher_2）。**不寫入 `CertificateProduction`**。
- **範圍外**：證書製作（`CertificateProduction`）不在本次匯入。

## 已確認決策

- 黃國倫啟動靈人種子班：**全員已結業**（創班種子教師，不受證書名單限制），結業日 **2025/03/08**。
- 174 個「零名單學員」班級：**不自動結業**（維持進行中）。
- 黃國倫啟動豐盛種子班結業日：**2026/03/08**。
- `李素真` 已直接存在名冊（A024），豐盛名單比對移除 ALIAS。

## 待確認（Open）

- 證書名單中 41 個名冊查無對應者（`graduation.json.unmatchedCertNames`）：本次未建立帳號、不歸入任何班級，僅記錄於資料檔。若需納入結業，另議。

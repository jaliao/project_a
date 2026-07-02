## 1. 名冊解析修正（收容班歸零）

- [x] 1.1 於 `build-roster.mjs` 新增 `cleanName()` 清除隱藏字元（`U+2060`/零寬/BOM/方向控制），並套用於姓名、teacherNo、班級學員解析
- [x] 1.2 重新產生 `roster.json`，確認 `unmatchedTeacherKeys`（收容班）為 0

## 2. 啟動豐盛種子班

- [x] 2.1 新增 `build-prosperity-seed.mjs`：解析 `doc/啟動豐盛種子教師名單.xlsx`、比對名冊（精確／簡繁／別名，`黃宣志`→B006），無法對應則報錯中止
- [x] 2.2 產生 `prosperity-seed.json`（`courseCatalogId=2`、`title`、65 位 `teacherKeys`）
- [x] 2.3 `seed.ts` §7c：建立黃國倫啟動豐盛種子班，成員疊加 `teacher_2` 並結業，日期 2026/03/08，受哨兵冪等保護

## 3. 啟動靈人結業判定（不涉證書製作）

- [x] 3.1 新增 `build-graduation.mjs`：以 `unzip` 解析兩份證書 docx、略過標題列、比對名冊（精確／簡繁／別名 `李素貞`→`李素真`）
- [x] 3.2 產生 `graduation.json`（`holderKeys` 631、`unmatchedCertNames` 39）
- [x] 3.3 `seed.ts` 日期常數：種子班 2025/03/08、一般結業班 2025/09/01、豐盛種子班 2026/03/08
- [x] 3.4 `seed.ts` §6：班級有 ≥1 holder → 課程結業（2025/09/01）；holder→`graduatedAt`、同班非 holder→`nonGraduateReason="other"`；零 holder 班維持進行中
- [x] 3.5 `seed.ts` §6b：種子班全員已結業（2025/03/08）
- [x] 3.6 `EnrollmentRow` 型別新增 `nonGraduateReason`，並更新統計 log

## 4. 審閱清單產出（docs）

- [x] 4.1 `doc/啟動靈人結業班級清單.md`（自動結業班級＋每位學員已/未結業＋零結業班附錄）
- [x] 4.2 `doc/有證書沒有班級資料的學員.md`（39 位查無名冊對應者，依已領取/待製作分組）

## 5. 型別與一致性檢查

- [x] 5.1 `npx tsc --noEmit` 對 `prisma/seed.ts` 無型別錯誤
- [x] 5.2 模擬驗證 seed 產出與審閱清單一致（169 結業班／174 零結業／584 已結業／161 未結業／種子班 68）

## 6. 套用與驗證（DB）

- [x] 6.1 全新 seed 套用：`make dev-clean && make dev`、`make prisma-dev-status && make prisma-dev-deploy && make prisma-dev-seed`
- [x] 6.2 於 Prisma Studio/後台驗證：收容班 0、豐盛種子班 65（teacher_2）、啟動靈人結業班 169、種子班 68 全結業
- [x] 6.3 抽查數筆未結業（其他）與進行中班級狀態正確

## 7. 文件與版本（套用時）

- [x] 7.1 依 CLAUDE.md 更新 `config/version.json`（0.1.115→0.1.116）與 `README-AI.md`（版本標頭＋已完成條目）
- [x] 7.2 檢視三份操作手冊：本次為 seed 資料、沿用既有功能（結業/講師身分/種子班），無 UI/流程/權限/路由異動 → 無需修改

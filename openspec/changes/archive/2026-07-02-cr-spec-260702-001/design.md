## Context

系統上線前以既有名冊建立正確的課程/結業狀態。資料來源有三份人工整理檔：

- `doc/啟動事工資料表_updated.xlsx` → 既有 `build-roster.mjs` 產生 `roster.json`（人員、課程、種子班/收容班 key）。
- `doc/啟動豐盛種子教師名單.xlsx` → 啟動豐盛種子教師（65 人）。
- `doc/已領取-啟動靈人證書.docx`、`doc/待製作-啟動靈人證書.docx` → 完成啟動靈人的學員名單。

現行 seed（`prisma/seed.ts`）已採「資料檔 → seed 消費」模式，並以「黃國倫啟動靈人種子班」為冪等哨兵。既有結業邏輯：教師學員一律結業、全教師班結業、種子班/收容班全結業。

本次要點：證書名單**不匯入 `CertificateProduction`**，改為判定啟動靈人各班的課程結業與學員結業狀態；新增啟動豐盛種子班；並修正名冊解析的隱藏字元 bug。系統無正式資料，套用方式為全新 seed。

## Goals / Non-Goals

**Goals:**
- 以證書名單判定啟動靈人：班級課程結業、學員已結業/未結業（其他）。
- 建立黃國倫啟動豐盛種子班（catalog 2），成員授予 teacher_2 並結業。
- 修正 `build-roster.mjs` 隱藏字元汙染（收容班誤判 → 歸零）。
- 所有名冊比對可重現（build script → JSON 產物），供 seed 執行期直接消費。
- 結業日期：種子班 2025/03/08、一般結業班 2025/09/01、豐盛種子班 2026/03/08。

**Non-Goals:**
- 不建立/不匯入 `CertificateProduction`（證書製作不在本次）。
- 不為「證書名單中查無名冊對應」的 39 人建立帳號或歸班。
- 不調整證書製作後台、報名申請等 UI/流程。
- 不處理啟動得勝（catalog 3）。

## Decisions

**1. 沿用「build script → JSON → seed 消費」管線**
新增 `build-prosperity-seed.mjs`→`prosperity-seed.json`、`build-graduation.mjs`→`graduation.json`，比照 `build-roster.mjs`。理由：seed 執行期不解析 xlsx/docx（維持與既有一致、可重跑），比對邏輯集中在 build 期、產物可審閱。替代方案（seed 內即時解析 docx）被否決：增加執行期相依與不可預期性。

**2. 姓名比對：精確 → 簡繁正規化 → 確認別名；解析期清隱藏字元**
比對順序為「原字串 → OpenCC `cn→tw` → 人工確認別名（ALIAS）」。`build-roster.mjs` 新增 `cleanName()` 清除 word joiner/零寬字元（`U+2060` 等），修正教師欄與班級名單同名卻比對失敗（誤入收容班）。同名教師沿用既有 `##teacherNo` key 區分；豐盛名單 `黃宣志` 以 AMBIG 指定 B006。替代方案（模糊比對）否決：易誤配，改以確認過的別名表。

**3. 以證書名單判定結業（不涉證書製作）**
holder 集合＝兩份 docx 名單解析並對應到 roster key（含簡繁）。規則：班級中 ≥1 位 holder → 課程結業；holder→`graduatedAt`，同班非 holder→`nonGraduateReason="other"`；零 holder 班級維持進行中（不設 `completedAt`）。種子班為創班種子教師，**全員結業**不受名單限制。替代方案（所有班級皆結業）否決：無證據的班級不應標結業。

**4. 結業日期與時間一致性**
以常數集中：`SEED_CLASS_DATE=2025-03-08`、`STARTER_GRAD_DATE=2025-09-01`、`PROSPERITY_SEED_DATE=2026-03-08`。結業班的 `startedAt` 與 `joinedAt` 設為對應結業日（而非未來的 `SNAPSHOT_DATE`），避免「開課晚於結業」的時間倒置；進行中班級維持 `SNAPSHOT_DATE`。

**5. 豐盛種子班身分授予與冪等**
成員以 `roles: { push: 'teacher_2' }` 疊加（保留 teacher_1）。整段與既有課程建立共用 `alreadySeeded`（種子班哨兵）守衛，僅於全新 seed 執行；roster 從不指派 teacher_2，故 push 不會重複。

**6. docx 解析：unzip + 段落標題略過**
`build-graduation.mjs` 以 `unzip -p … word/document.xml` 取 XML，逐段落抽 `<w:t>` 文字、依 `、/,/，/空白` 切名，並略過含「證書：」的標題列（修正原先只砍第一個 token 導致標題殘留為假人名）。

**7. 收容班維持為資料驅動安全網**
`unmatchedTeacherKeys` 為空即不建收容班；保留程式碼以兜住日後名冊漏網教師，不硬刪。

## Risks / Trade-offs

- **OpenCC 台灣模式過度轉換姓氏**（如 `王余美華`→`王餘美華`）→ 僅影響「查無名冊」的顯示名單；這些人不進系統。必要時改以原檔拼法顯示。
- **roster 為簡體、證書為繁體的少數姓名**（如 `潘爱生`）可能比對不到 → 已用 s2t 降低；殘餘由審閱清單人工檢視。
- **39 位證書 holder 查無名冊對應** → 本次不建帳號/不歸班，僅記於 `graduation.json.unmatchedCertNames` 與 `doc/有證書沒有班級資料的學員.md`；若需納入結業另議。
- **冪等哨兵**：改動只在全新 seed 生效；既有已 seed 的 DB 重跑不會補建 → 上線前以重置流程套用（可接受，因無正式資料）。
- **既有結業語意調整**：一般班改為「證書名單決定結業」，取代舊「教師學員一律結業」→ 少數僅靠舊規則結業的教師若不在名單且不在種子班，將不再自動結業；由審閱清單把關。

## Migration Plan

1. 依序重生產物：`build-roster.mjs` → `build-prosperity-seed.mjs` → `build-graduation.mjs`。
2. 全新 seed 套用：`make dev-clean && make dev`、`make prisma-dev-status && make prisma-dev-deploy && make prisma-dev-seed`。
3. 驗證：收容班 0、豐盛種子班 65（teacher_2）、一般結業班 169、零結業 174、種子班 68 全結業。
4. Rollback：本次僅動 seed 資料與 seed 腳本，無 schema migration；回滾即還原檔案並重新 seed。

## Open Questions

- 39 位「有證書、無班級資料」者是否於後續建立帳號並歸入某收容班（目前擱置）。
- 「查無名冊」顯示名單是否改用證書原檔拼法（避免 `余→餘` 類誤轉）。

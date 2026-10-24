## 1. 共用邏輯

- [x] 1.1 `lib/data/monthly-report.ts` 新增常數 `SYSTEM_ROOT_SPIRIT_ID = 'PA260001'` 與 `getSystemRootUserId()`（依 spiritId 查一次 `userId`，查無則回傳 `null`）

## 2. `generations()`

- [x] 2.1 新增 `qualifiedTeacherSet`：`teacherSet` 過濾為 `mentorOf.has(t) || t === systemRootId`
- [x] 2.2 `teacherTotal`、彙總迴圈（`for (const t of teacherSet)`）、`gen()` 內的 `teacherSet.has(m.teacherId)` 判定，全部改用 `qualifiedTeacherSet`

## 3. `generationTeacherDetails()`

- [x] 3.1 比照 2.1 新增 `qualifiedTeacherSet`
- [x] 3.2 `teacherIds`（輸出清單來源）、`hasMentor` 判定中的 `teacherSet.has(m.teacherId)`、`gen()` 內判定，全部改用 `qualifiedTeacherSet`；`labelById`／`earliestByTeacher` 維持以原始 `teacherSet` 建立（純查找用途不受影響）

## 4. 前端說明文字

- [x] 4.1 「世代倍增」子區塊「說明」對話框靜態文案（`monthly-report-section.tsx` 的 `GenerationsExplainDialog`），依 spec 新增「教師本人須已結業對應書籍」與「黃國倫固定例外」說明

## 5. 驗證

- [x] 5.1 以正式環境真實資料直接呼叫修改後的 `generationTeacherDetails()`（2026-09 cutoff）：共 167 位教師（原 168，少 1），第 0 代僅黃國倫 1 人，盧正義不在清單中
- [x] 5.2 以正式環境真實資料呼叫 2026-10 cutoff：盧正義正確顯示第 2 代（導師：張幸瑜，第 1 代）
- [x] 5.3 raw data 匯出端點直接消費 `generationTeacherDetails()`，已於 5.1 確認該函式輸出正確（167 筆、bucket [0:1, 1:57, 2:92, 3:15, 4:2] 合計 167，與教師總數一致）
- [x] 5.4 `npm run lint` 與 `npm run build` 通過

## 6. 文件同步

- [x] 6.1 依 CLAUDE.md 第 9 點，檢查並更新 `doc/管理者操作手冊.md`（版本標頭、「世代倍增發展追蹤」項目新增本人須已結業門檻與黃國倫固定例外說明）
- [x] 6.2 `config/version.json` patch 版本號 +1 為 `0.1.235`，`updatedAt` 更新為 `2026-10-24`；`README-AI.md` 索引版本號同步更新
- [x] 6.3 依 CLAUDE.md 第 8 點更新 `ai-context/05-business-logic.md`（新增「世代倍增教師資格認定」小節）與 `ai-context/07-current-tasks.md`（「已完成」清單最前面附加本次 CR 紀錄）

## 7. 延伸修正（2026-10-25，候選教師範圍放寬＋已開課冊別篩選）

背景：使用者發現後台「講師分析」卡片「啟動講師」（509，純身分旗標）與「世代倍增發展追蹤」（原 178）口徑落差過大且難以互相核對，要求：①「已開課」人數應依冊別篩選；②世代倍增候選教師範圍放寬為「只要開班即算」。因與本 CR 的核心修法（教師須本人已結業）屬同一計算函式，於本 CR 延伸處理，避免與本 CR 的收斂條件互相牴觸、重新引入盧正義型根節點誤判。

- [x] 7.1 `lib/data/monthly-report.ts` `generations()`／`generationTeacherDetails()`：候選教師集合改為「cutoff 前曾建立啟動靈人 `CourseInvite`」，不再要求「班上已有人結業」；教師集合＝候選中收斂「本人也已結業」（`mentorOf.has(t) || t === systemRootId`，沿用本 CR 的既有收斂條件不變）
- [x] 7.2 `lib/data/dashboard.ts` `getDashboardStats()`：三個「已開課」計數加上對應冊別篩選（`teacher_1`→`courseCatalogId=1`、`teacher_2`→2、`teacher_3`→3）
- [x] 7.3 「世代倍增」說明對話框（`monthly-report-section.tsx`）文案同步更新為「候選教師」／「教師」兩階段定義
- [x] 7.4 `npm run tsc --noEmit`、`npm run lint` 皆通過
- [x] 7.5 `doc/管理者操作手冊.md`（版本標頭、講師分析「已開課」冊別說明、世代倍增候選教師說明）、`config/version.json`（`0.1.236`）、`README-AI.md`、`ai-context/05-business-logic.md`、`ai-context/07-current-tasks.md`、`openspec/specs/admin-dashboard-monthly-report/spec.md`（本 CR delta）、`openspec/specs/admin-dashboard/spec.md`（已開課冊別篩選，不屬本 CR capability，直接更新主 spec）皆已同步更新
- [ ] 7.6 待以正式環境真實資料驗證放寬後的教師總數與各代分布（部署後於正式環境核對）

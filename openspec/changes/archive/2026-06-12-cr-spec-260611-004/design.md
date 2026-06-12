## Context

`prisma/seed.ts`（名冊式，`cr-spec-260605-001`）由 `roster.json`（源自 `doc/啟動事工資料表_updated.xlsx`）建立：管理員、黃國倫、課程目錄、教會、1361 位人員（231 教師 / 1130 學員）、340 門課程 + 收容班，以及 approved 報名。目前報名 `materialChoice` 預設 `none`、無 `graduatedAt`，課程一律 `startedAt`（進行中）。本變更在 seed 執行期補上結業與教材規則。

資料事實（已驗證）：231 位教師每位都至少在某門課當過學員（152 在一般課程、79 在收容班），因此「凡老師學員都結業」可使全數教師取得啟動靈人證書。

## Goals / Non-Goals

**Goals:**
- 每位教師取得啟動靈人結業證書（可實際開課）。
- 整班皆教師的課程標記為已結業。
- 所有報名教材為繁體。
- 黃國倫維持開課資格。

**Non-Goals:**
- 不修改 `build-roster.mjs` / `roster.json` / 來源 xlsx。
- 不改 DB schema。
- 不變更非 seed 的執行期邏輯。

## Decisions

### 1. 教師集合判定（執行期）
seed 內建立 `teacherKeys = Set(roster.people 中 roles 含 'teacher' 的 key)`。判定「學員是否為老師」一律以 `teacherKeys.has(studentKey)`。

### 2. 報名建立規則
每筆 `InviteEnrollment`：
- `status: 'approved'`、`joinedAt: SNAPSHOT_DATE`、`materialChoice: 'traditional'`。
- 若 `teacherKeys.has(studentKey)` → `graduatedAt: SNAPSHOT_DATE`（啟動靈人結業證書）；否則不設。

### 3. 課程結業規則
每門課（一般課程與收容班）建立時：
- 沿用 `startedAt: SNAPSHOT_DATE`。
- 若該課所有 `studentKeys` 皆在 `teacherKeys` 中（且至少 1 位學員）→ 額外設 `completedAt: SNAPSHOT_DATE`。
- 收容班學員皆為 unmatched 教師 → 必為全老師班 → `completedAt` 設定。

> 混合班維持進行中（僅 startedAt），其中教師學員的報名仍有 graduatedAt——此為使用者已接受的狀態。

### 4. 黃國倫結業報名
黃國倫為保留帳號、不在 roster.people，故不會被上述規則涵蓋。seed 另建立一筆：將黃國倫以 approved + `graduatedAt=SNAPSHOT_DATE` 報名至一門啟動靈人課程（取第一門建立的課程，或無課程時略過），確保其 `getMyCompletionCertificates` 有證書、canTeach 第二層通過。

### 5. 冪等
沿用收容班哨兵 `alreadySeeded`：已 seed 過則跳過課程／報名（含本次新增的結業／教材寫入），避免重跑重複。

## Risks / Trade-offs

- **混合班的資料半結業狀態**：進行中課程出現部分已結業學員，略不直覺但符合使用者選擇與真實情境（資深學員已成為老師）。
- **graduatedAt 全用同一快照日**：所有證書同日，非真實分布；seed 資料可接受。
- **seed-course-completions 退場**：移除過時需求後，主 specs 由新的 `seed-roster-data` 描述，避免兩份衝突的 seed 規格。

## Context

`generations()` 與 `generationTeacherDetails()`（`lib/data/monthly-report.ts`）目前各自獨立查詢、各自建立 `mentorOf` 與 `teacherSet`（兩份邏輯重複，見檔案內註解「計算邏輯與 generations() 相同，獨立重算一次」）。兩者的 `mentorOf: Map<string, { teacherId: string; at: Date }>` 皆以 `r.userId`（每筆已結業報名的學員）為 key，只要某人 `mentorOf.has(t)` 為真，就代表此人在 cutoff 前**本人也有一筆啟動靈人已結業紀錄**——這與本次要新增的「教師本人須已結業對應書籍」判定條件完全等價，不需要另外查詢或建立新的 Map。

正式環境驗證（2026-09 cutoff）：`teacherSet` 168 人、`mentorOf` 涵蓋其中 167 人（僅盧正義 PA260268 在教師集合中但自己尚無 `mentorOf` 紀錄）；黃國倫（PA260001）本人完全沒有任何啟動靈人 `InviteEnrollment`（唯一一個合法的真根節點，`mentorOf` 恆不含他），須以固定例外處理，否則會被新規則一併排除。

## Goals / Non-Goals

**Goals:**
- 教師集合新增「本人在 cutoff 前已有對應書籍的結業紀錄」的資格條件，不符合者不出現在月報與下載的 raw data 中。
- 黃國倫（`spiritId = 'PA260001'`）固定例外，永遠視為合格、落在第 0 代。
- 複用既有 `mentorOf` 判定本人是否已結業，不新增查詢、不新增第二套「結業」定義。

**Non-Goals:**
- 不更動月份 cutoff 的設計本身（維持「世代隨月份連動」，`CR-FIX-261024-001` 已討論過全量資料方案並確認不採用）。
- 不處理 `CR-FIX-261024-001` 已完成的「禁止未結業者取得老師身分／開班」防呆。
- 不為黃國倫以外的帳號提供固定例外機制——目前正式環境僅他一人是唯一合法真根節點；未來若有其他合理根節點需求，另案討論是否擴充為清單。

## Decisions

### 1. 教師集合資格過濾：複用 `mentorOf.has(t)`，新增 `qualifiedTeacherSet`

兩個函式原本都已各自建立 `mentorOf`（key 為「本人」）與 `teacherSet`（value 為「建課者」）。新增一行過濾：

```ts
const systemRootId = await getSystemRootUserId() // 查一次，見決策 2
const qualifiedTeacherSet = new Set(
  [...teacherSet].filter((t) => mentorOf.has(t) || t === systemRootId),
)
```

後續世代計算（`gen()` 遞迴）、`teacherTotal`／`buckets` 彙總（`generations()`）、`details` 輸出清單（`generationTeacherDetails()`）皆改用 `qualifiedTeacherSet` 取代原本的 `teacherSet`：
- `gen()` 內 `!teacherSet.has(m.teacherId)` 改為 `!qualifiedTeacherSet.has(m.teacherId)`——若某人的 mentor 本身不合格（如 9 月的盧正義），比照既有「mentor 不在教師集合」語意，該學員自己若也是教師則落為第 0 代（既有行為的自然延伸，非新邏輯分支）。
- `generations()` 的 `for (const t of teacherSet)` 改為 `for (const t of qualifiedTeacherSet)`，`teacherTotal: teacherSet.size` 改為 `qualifiedTeacherSet.size`。
- `generationTeacherDetails()` 的 `teacherIds = [...teacherSet]` 改為 `[...qualifiedTeacherSet]`，`hasMentor` 判定中的 `teacherSet.has(m.teacherId)` 同步改為 `qualifiedTeacherSet.has(m.teacherId)`。

`labelById`、`earliestByTeacher` 等輔助 Map 仍可照舊以完整 `teacherSet` 建立（純查找用途，不影響輸出範圍），避免不必要的程式碼分支。

### 2. 黃國倫固定例外：以 `spiritId` 常數查一次 `userId`，不寫死 UUID

```ts
// 系統根節點固定例外：黃國倫為系統創始人，正式環境本人無任何啟動靈人結業紀錄，
// 為唯一合法的真根節點，世代計算恆視為合格並落在第 0 代。
const SYSTEM_ROOT_SPIRIT_ID = 'PA260001'

async function getSystemRootUserId(): Promise<string | null> {
  const u = await prisma.user.findFirst({
    where: { spiritId: SYSTEM_ROOT_SPIRIT_ID },
    select: { id: true },
  })
  return u?.id ?? null
}
```

以 `spiritId` 而非寫死 `User.id`（UUID）查找：`spiritId` 是專案既有的穩定人類可讀識別碼（啟動編號），程式碼中直接寫 `PA260001` 比寫死一串 UUID 更易讀、易於未來稽核；若查無此 `spiritId`（理論上不會發生），`systemRootId` 為 `null`，過濾條件 `t === null` 恆為假，不影響其餘邏輯（不拋錯、優雅降級）。

兩個函式各自獨立呼叫 `getSystemRootUserId()` 一次（維持現有「兩函式各自獨立重算」的既定模式，不引入共用快取層，避免額外跨呼叫狀態）。

### 3. 「說明」對話框文字更新（純前端靜態文案）

在既有「教師」「導師」「第 0 代」三點說明之後，新增第四點：「教師本人須在所選月份底前已有自己的結業紀錄才會列入教師集合；黃國倫為系統創始人固定例外，恆列為第 0 代」。不查詢資料庫，與既有實作模式一致。

## Risks / Trade-offs

- 教師集合縮小後，`generations()` 回傳的 `teacherTotal`（教師總數統計卡）會比目前略低（排除掉「本人當月未結業」者）；這是本次要的效果（避免誤導），但若有人拿新舊月報數字比對歷史趨勢，教師總數可能比先前看到的數字少 1（以目前正式資料為例）。
- 若未來黃國倫本人意外被加入一筆啟動靈人結業紀錄（例如比照 dev seed 腳本的作法補資料），固定例外仍會生效（`t === systemRootId` 恆真），不影響其正確性，但屆時其實已不再需要這個例外分支——不在本次處理範圍，留待資料面另行判斷。

## Why

需求單 CR-SPEC-260828-007（提出人：廖柏嘉 Justin，2026-08-28）：CR-SPEC-260828-003／009／012 上線後「我的學習（分段查經）」的體驗優化。目前書籍子頁的課次展開後仍是「每個經文項目一個『新增分段查經』按鈕 → 開表單 → 可存多筆 → 每筆可編輯／刪除（含二次確認）」，操作層級偏深、畫面偏重。

需求原文要點：

- 「我的學習」裡把課次分成 **無需填寫｜待填寫｜填寫中｜已完成** 四種狀態。
- 每一課展開後 **直接出現三個表單**（對應該課次的三個經文項目），不用再點「新增分段查經」。
- 版面樣式排版 **參考「聯繫管理者」**。
- **不需要能填寫多筆**：一個經文項目一格一筆，畫面比較簡單直覺。
- **可以修改，不需要刪除的按鈕**。
- 存檔之後就是 **檢視模式**，卡片樣式與文字大小 **參考「聯繫管理者」的卡片**（`InquiryCard`）。

### 澄清決策（2026-08-28，使用者回覆）

1. **版面結構**：**保留 CR-009 的兩層結構與課次卡片牆 accordion**（不改為「四區塊分組」全平鋪）。只改：①課次卡片徽章由三態擴為四態；②展開後的內層 panel 由「多筆筆記 CRUD」改為「三個經文項目各一格、直接出現表單／檢視卡」。
2. **既有多筆資料**：**不加 DB 唯一鍵**。程式層把每個經文項目視為「單筆」——`createStudyEntry` 改為 idempotent（該格已有筆記則更新最早那筆、沒有才建立），UI 每格只顯示／編輯最早一筆。萬一 CR-003／009 時期已存在的多餘筆記 **不刪、不顯示**，零資料遺失（符合「上線資料相容」原則）。

## What Changes

- **課次狀態：三態 → 四態**
  - `無需填寫`（`noScripture`）：課次無經文項目（啟動靈人第一／十二課、啟動豐盛第一課）——計入「已完成」。
  - `待填寫`（`todo`）：課次有經文項目，三格 **一格都沒填**。
  - `填寫中`（`partial`）：課次有經文項目，**填了 1～2 格**。
  - `已完成`（`done`）：課次有經文項目，**三格全填**——計入「已完成」。
  - 書籍子頁頂部「已完成 X / 共 Y 課」＝ 狀態為 `done` 或 `noScripture` 的課次數（比 CR-009 的「有任一筆即算完成」更嚴格）。
- **展開後的內層 panel（`lesson-entries-panel.tsx` 改寫）**
  - 有經文項目時，三個經文項目以 **與「聯繫管理者」相同的卡片網格**（`grid grid-cols-1 sm:grid-cols-3 gap-3`、每格 `rounded-lg border p-4`）排列。
  - 每格：**已有筆記 → 檢視卡**（樣式／文字大小比照 `InquiryCard`）＋「編輯」；**尚無筆記 → 直接顯示建立表單**（總標題必填、其餘選填），存檔後轉檢視卡。
  - **移除「刪除」**（按鈕與 `AlertDialog` 二次確認），移除「新增分段查經」入口（表單常駐）。
  - 無經文項目的課次維持顯示 `t('noScripture')` 提示。
- **元件**
  - `study-entry-card.tsx`：移除刪除 UI（`deleteStudyEntry` 呼叫、`AlertDialog`、`IconTrash`）；卡片改採 `InquiryCard` 的文字級距（標題 `text-sm font-medium`、內文 `whitespace-pre-wrap text-sm`、時間 `text-xs text-muted-foreground`）；保留「編輯」切換內嵌 `StudyEntryForm mode="edit"` 與「已編輯／更新時間」標示。
  - `study-entry-form.tsx`：`create` 模式為常駐表單，只留「儲存」（不顯示「取消」）；`edit` 模式維持「儲存＋取消」。其餘（欄位、Zod、`react-hook-form`）不變。
  - `lesson-grid.tsx`：`LessonState` 由 `'done' | 'todo' | 'noScripture'` 擴為 `'done' | 'partial' | 'todo' | 'noScripture'`；四態徽章與邊框配色（沿用既有 Tailwind 色階，另有文字標記符合無障礙）。
- **資料層（`lib/data/learning-study.ts`）**
  - 新增 `getFilledOutlineSlots(userId, courseCatalogId): Promise<Set<string>>`（回傳 `lessonKey::scriptureKey` 集合，`findMany` + `distinct: ['lessonKey', 'scriptureKey']`），供兩頁計算四態與進度。
  - 移除 `getLessonKeysWithEntries`（改用上者；粒度不足）。`getStudyEntriesForUser`／`getUnlockedLearningCatalogIds`／`outlineSlotKey` 不變。
- **Server actions（`app/actions/learning-study.ts`）**
  - `createStudyEntry`：驗證（session／Zod／`isValidOutlinePath`／已解鎖）之後，改為 **先 `findFirst` 該 `(userId, courseCatalogId, lessonKey, scriptureKey)` 最早一筆**——存在則 `update` 其內容、不存在才 `create`（idempotent，避免產生第二筆）。
  - `deleteStudyEntry`：**移除**（`grep` 確認無其他呼叫端後刪除；若後台匯入工具有用到則保留但學員端不再呼叫）。
  - `updateStudyEntry`：不變（擁有者檢查＋內容更新＋`revalidatePath`）。
- **路由頁**
  - `/user/{spiritId}/learning`（書籍卡片頁）：`doneCount` 改用 `getFilledOutlineSlots` ＋ 大綱計算「`done` + `noScripture`」課次數。
  - `/user/{spiritId}/learning/{catalogId}`（書籍子頁）：以 `getFilledOutlineSlots` 傳入 `LessonGrid`；孤兒筆記區塊沿用（檢視卡、無刪除）。守衛、redirect、鎖定訊息不變。
- **i18n（`learning` 命名空間）**
  - 新增 `lessonPartial`（「填寫中」）；`lessonDone` 文案由「已填寫」改為「已完成」。
  - 移除 `addEntry`／`noEntries`／`delete`／`deleteConfirmTitle`／`deleteConfirmBody`／`deleteConfirmAction`（不再使用）。
  - `messages/zh-TW.json` 繁體來源 ＋ `messages/en.json` 對應；`npm run gen:zh-cn` 重新產生 `zh-CN`。
- **文件／版本**：`doc/學員手冊.md` 第八章「我的學習」小節改寫為「四態 ＋ 展開直接三格表單 ＋ 存檔轉檢視、可改不可刪」；`config/version.json` patch +1、`updatedAt`（apply 時）。老師手冊／管理者手冊純學員端不涉及。

## Capabilities

### Modified Capabilities
- `my-learning`：分段查經筆記由「同一經文項目可多筆、可刪除、點按鈕新增」改為「一個經文項目一格一筆、可改不可刪、表單常駐」；課次完成狀態由兩態擴為四態（無需填寫／待填寫／填寫中／已完成）；展開內層版面比照「聯繫管理者」卡片。

## Impact

- **Affected code**：
  - 修改：`components/learning/lesson-entries-panel.tsx`、`components/learning/lesson-grid.tsx`、`components/learning/study-entry-card.tsx`、`components/learning/study-entry-form.tsx`、`lib/data/learning-study.ts`、`app/actions/learning-study.ts`、`app/[locale]/(user)/user/[spiritId]/learning/page.tsx`、`app/[locale]/(user)/user/[spiritId]/learning/[catalogId]/page.tsx`、`messages/zh-TW.json`／`messages/en.json`、`doc/學員手冊.md`
  - 不變：`config/learning-outline.ts`、`lib/schemas/learning-study.ts`、`components/learning/learning-catalog-grid.tsx`、`prisma/schema/learning-study.prisma`
- **Database**：**無 schema 變更**（不加唯一鍵；`LearningStudyEntry` 沿用）。
- **既有資料**：零遷移。CR-003／009 時期若已有同一經文項目多筆的筆記，改版後只顯示／可編輯「最早一筆」，其餘保留於 DB、不顯示、不刪除。已填內容一律照常顯示。
- **UI / 行為**：學員端 `/user/{spiritId}/learning/{catalogId}` 展開課次後的互動改變（無新頁面、無路由變更）。刪除功能自學員端移除。
- **Route access**：不變（`(user)` group layout 既有守衛）。
- **Dependencies**：無新增套件。

## Open Questions

- 無。四態門檻、單筆語意、刪除移除、既有多筆處理皆已由使用者澄清決策確認。

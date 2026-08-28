## Why

需求單 CR-SPEC-260828-010（提出人：廖柏嘉 Justin，2026-08-28）：個人首頁（`/user/{spiritId}`）基本資料區塊的「學習進度三卡」（`CourseProgressCards`）目前只有「已結業 / 未結業」兩態，且與 CR-003/007/009/012 建立的「我的學習」分段查經完全沒有連動。要優化為：

- 需要看到 **未完成 ｜ 進行中 ｜ 已完成** 三種狀態。
- 每一本課（啟動靈人／啟動豐盛／啟動得勝）可以看到**作業完成度**（＝「我的學習」分段查經的課次填寫進度）。
- **進行中**與**已完成**的卡片可以點進「我的學習」對應的書籍子頁。

### 澄清決策（2026-08-28，使用者回覆）

1. **三態判定**（每個課程目錄；此為「課程參與」層級，與「我的學習」的課次填寫狀態是不同維度）：
   - **已完成** = 有結業證明（`CertificateProduction` / `graduatedAt`）。
   - **進行中** = 未結業，且該目錄有一筆 `status = approved`、未取消、所屬開課 `startedAt` 已設定的報名（＝「我的學習」的解鎖條件）。
   - **未完成** = 其餘（未報名 / 只有待審 pending / 尚未開課）。
2. **作業完成度**：顯示「**已完成 X / 共 Y 課**」。**與「我的學習」書籍卡片頁、子頁頂部完全同一套算法與口徑**——沿用 CR-007 的四態：`X` = 狀態為 `done`（該課次三個經文格全填）或 `noScripture`（無經文項目）的課次數；`Y` = 該目錄課次總數。**本人與他人視角皆可見**（比照三卡既有「公開資訊」規則）。設定檔尚無大綱的目錄（啟動得勝）不顯示完成度。
3. **卡片可點**：`本人視角` 且 卡片為 `進行中` 或 `已完成` 且 該目錄在設定檔中有大綱時，整張卡片為連結，導向 `/user/{spiritId}/learning/{catalogId}`。其餘（他人視角、未完成卡、無大綱目錄）不可點。

## Context：與 CR-SPEC-260828-007 的關係

本 CR 在分支 `feat/cr-spec-260828-007-my-learning-optimize` 上，**接續於 CR-007（已實作、尚未提交）之上**。CR-007 已把「我的學習」的課次完成度判定改為：

- `lib/data/learning-study.ts`：`getFilledOutlineSlots(userId, courseCatalogId): Promise<Set<string>>`（回傳 `lessonKey::scriptureKey` 集合）；**已移除** CR-009 的 `getLessonKeysWithEntries`。
- `config/learning-outline.ts`：`LessonFillState = 'noScripture' | 'todo' | 'partial' | 'done'`、`lessonFillState(lesson, filledSlots)`、`isLessonCompleted(lesson, filledSlots)`（`done || noScripture`）。
- 書籍卡片頁 `learning/page.tsx` 的「已完成 X / 共 Y 課」＝ `outline.lessons.filter(l => isLessonCompleted(l, filledSlots)).length`。

CR-010 直接**複用**上述函式計算首頁三卡的作業完成度，確保三處（首頁三卡、書籍卡片頁、書籍子頁頂部）數字一致。

## What Changes

- **`lib/data/learning-study.ts`**：新增 `getLearningProgressByCatalog(userId): Promise<Record<number, { done: number; total: number }>>`——對 `getOutlineCatalogIds()` 每個 id，`total = getCatalogOutline(id).lessons.length`、`done = lessons.filter(l => isLessonCompleted(l, await getFilledOutlineSlots(userId, id))).length`；僅回傳有大綱的目錄。
- **`components/learning/course-progress-cards.tsx`**（改寫）：
  - 由兩態改為**三態**（未完成／進行中／已完成），各有對應 icon 與樣式。
  - 已完成／進行中卡片，於該目錄有大綱時新增「已完成 X / 共 Y 課」作業完成度列（本人他人一致）。
  - 「進行中／已完成 + 有大綱 + 本人視角」的卡片整張包 `next/link` 連至 `/user/{spiritId}/learning/{catalogId}`；否則為純 `div`。
  - 新增 props：`inProgressCatalogIds: number[]`、`progressByCatalog: Record<number, { done: number; total: number }>`、`spiritId: string`、`isOwnPage: boolean`。
- **`app/[locale]/(user)/user/[spiritId]/page.tsx`**：
  - `certByCatalogId` map；`inProgressCatalogIds` = 既有 `enrollments`（已排除 cancelled）過濾 `status === 'approved' && startedAt != null` 取 distinct `courseCatalogId`，再排除 `certByCatalogId.has(id)`。
  - `progressByCatalog = await getLearningProgressByCatalog(user.id)`（本人他人皆算）。
  - 傳入 `<CourseProgressCards>`（含 `spiritId`、`isOwnPage`）。
- **不變**：`LearningStudyEntry` 表、`app/actions/learning-study.ts`、Zod、路由、`/user/{spiritId}/learning` 兩層頁面、`config/learning-outline.ts`、i18n（本頁與該元件維持既有寫死繁體風格，比照 CR-003/007/009）。

## Capabilities

### Modified Capabilities
- `student-profile-page`：「基本資料區塊 — 學習進度三卡」需求擴充為三態 + 作業完成度（對齊「我的學習」四態口徑）+ 進行中／已完成可連入「我的學習」。

## Impact

- **Affected code**：`lib/data/learning-study.ts`（新增一函式）、`components/learning/course-progress-cards.tsx`（改寫）、`app/[locale]/(user)/user/[spiritId]/page.tsx`（兩段資料計算與 props 傳遞）。
- **Database**：無 schema 變更；沿用 `getMyEnrollments`／`getMyCompletionCertificates`／CR-007 的 `getFilledOutlineSlots`。
- **UI / 行為**：僅個人首頁基本資料區塊的三卡。他人視角新增「作業完成度」顯示（公開）、卡片維持不可點。
- **Docs**：`doc/學員手冊.md` 第八章「學習進度（個人首頁基本資料）」小節同步三態、完成度與可點說明；`config/version.json` patch +1（apply 時）。
- **Dependencies**：無。

## Open Questions

無。

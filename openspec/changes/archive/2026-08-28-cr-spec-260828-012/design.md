## Context

CR-SPEC-260828-009（已封存）把「我的學習」改為兩層卡片結構，並將大綱設定檔 `config/learning-outline.ts` 的資料模型定為：

```ts
export const LEARNING_OUTLINE: Record<number, CatalogOutline> = {
  1: { courseCatalogId: 1, lessons: [ /* 啟動靈人 lesson-01 ~ lesson-12 */ ] },
  // 2 / 3 待補
}
```

- `LessonOutline`：`{ key, order, title, scriptures: ScriptureOutline[] }`；`scriptures` 空陣列 = 該課次無分段查經。
- `ScriptureOutline`：`{ key, label }`。
- helper：`getCatalogOutline` / `getOutlineCatalogIds` / `getLesson` / `getScripture` / `isValidOutlinePath`。
- 書籍卡片頁（`/user/{spiritId}/learning`）：對每個 `CourseCatalog` 算 `hasOutline = !!getCatalogOutline(id)`、`unlocked`（有已開始報名）、`canEnter = hasOutline && unlocked`；不可進入者依 `lockReason`（`comingSoon` 無大綱 / `locked` 未解鎖）顯示鎖定卡。
- 課次卡片配色：無經文課次一律「完成」；有經文課次依 `getLessonKeysWithEntries` 是否命中該 `lessonKey` 決定「完成 / 未完成」。
- `key` 發布後不可變更（筆記以 `courseCatalogId + lessonKey + scriptureKey` 三元組參照）。

`CourseCatalog` seed：id 2 = 啟動豐盛（`isActive: true`）。

## Goals / Non-Goals

**Goals：** 於 `config/learning-outline.ts` 追加啟動豐盛（`courseCatalogId = 2`）12 課大綱，使已解鎖啟動豐盛的學員可撰寫分段查經。

**Non-Goals：**
- 不動資料表、server actions、Zod、i18n、路由、元件——CR-009 的機制已完整。
- 不建置啟動得勝（id 3）。
- 不改課次卡片配色 / 解鎖判定邏輯。

## Decisions

### 1. `LEARNING_OUTLINE[2]` 內容

`lessonKey` 為 `lesson-01` ~ `lesson-12`（catalog 2 命名空間，與 catalog 1 不衝突）。`scriptureKey` 沿用 CR-009 慣例「`<書卷英文縮寫小寫>-<章數 2 位補零>`」，同一 catalog 內唯一。

| lessonKey | order | title | scriptures（key → label） |
|---|---|---|---|
| lesson-01 | 1 | 第一課：開啟祝福的第一步 孝敬父母 | （空） |
| lesson-02 | 2 | 第二課：婚姻（一）上帝的藍圖與設計 | `genesis-02` 創世記二章 / `malachi-02` 瑪拉基書二章 / `ephesians-05` 以弗所書五章 |
| lesson-03 | 3 | 第三課：婚姻（二）婚姻 101 | `psalm-32` 詩篇三十二篇 / `psalm-51` 詩篇五十一篇 / `psalm-62` 詩篇六十二篇 |
| lesson-04 | 4 | 第四課：我們的下一代 以神為中心的敬虔之路 | `hebrews-12` 希伯來書十二章 / `colossians-03` 歌羅西書三章 / `proverbs-22` 箴言二十二章 |
| lesson-05 | 5 | 第五課：靈人啟動後的全新關係 | `1corinthians-12` 哥林多前書十二章 / `ephesians-02` 以弗所書二章 / `romans-12` 羅馬書十二章 |
| lesson-06 | 6 | 第六課：新人與工作 | `genesis-01` 創世記一章 / `mark-10` 馬可福音十章 / `matthew-20` 馬太福音二十章 |
| lesson-07 | 7 | 第七課：喜樂的心乃是良藥 | `matthew-06` 馬太福音六章 / `isaiah-30` 以賽亞書三十章 / `philippians-04` 腓立比書四章 |
| lesson-08 | 8 | 第八課：醫治（一）祂能，祂也肯 | `isaiah-53` 以賽亞書五十三章 / `matthew-08` 馬太福音八章 / `1peter-02` 彼得前書二章 |
| lesson-09 | 9 | 第九課：醫治（二）今天就支取醫治的恩典 | `hebrews-11` 希伯來書十一章 / `romans-08` 羅馬書八章 / `mark-02` 馬可福音二章 |
| lesson-10 | 10 | 第十課：醫治（三）拆毀堅固的營壘 | `romans-10` 羅馬書十章 / `ephesians-06` 以弗所書六章 / `mark-09` 馬可福音九章 |
| lesson-11 | 11 | 第十一課：神國金錢觀 | `luke-16` 路加福音十六章 / `deuteronomy-08` 申命記八章 / `psalm-49` 詩篇四十九篇 |
| lesson-12 | 12 | 第十二課：兒子的真正自由 | `luke-18` 路加福音十八章 / `2corinthians-08` 哥林多後書八章 / `2corinthians-09` 哥林多後書九章 |

### 2. 書名用字

需求單原文寫「創世紀」，依聖經和合本正式書名於 `label` 採「**創世記**」。`label` 為顯示文字、日後可改，不影響 `key`。其餘書名照需求單。

### 3. 課次標題格式

沿用 CR-009 的「第 N 課：<標題>」。第一課、第四課的副標與主標之間依需求單以半形空格分隔（顯示文字，可再調）。婚姻課的「(一)/(二)」轉全形「（一）／（二）」與 CR-009 一致。

### 4. 檔首註解

由「啟動豐盛（2）／啟動得勝（3）之課次內容待日後補上」改為「啟動豐盛（2）已建置十二課；啟動得勝（3）待日後補上」。

## Risks / Trade-offs

- **[低風險] 書卷 slug 命名**：新出現的書卷（`genesis`／`malachi`／`ephesians`／`hebrews`／`colossians`／`proverbs`／`1corinthians`／`romans`／`isaiah`／`philippians`／`1peter`／`deuteronomy`／`2corinthians`）採常見英文縮寫全稱小寫；數字開頭（`1corinthians` 等）作為物件 key 合法。發布後不可變更。
- 純設定檔追加，`tsc` / `build` 即可驗證結構正確；revert commit 即回滾，無資料影響。

## Migration Plan

1. `config/learning-outline.ts`：`LEARNING_OUTLINE` 加入 `2: { courseCatalogId: 2, lessons: [...] }`（依 Decision 1 表格）；更新檔首註解。
2. `npm run lint` ＋ `npx tsc --noEmit` ＋ `npm run build`。
3. `doc/學員手冊.md` 第八章「我的學習」小節補「啟動豐盛亦已開放（12 課）」；`config/version.json` patch +1、`updatedAt`。

**Rollback**：單一設定檔追加，revert commit 即可。

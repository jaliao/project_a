## Why

需求單 CR-SPEC-260828-009（提出人：廖柏嘉 Justin，2026-08-28）：CR-SPEC-260828-003「我的學習」上線後的改版與資料補齊。

需求原文要點：

- 分段查經的卡片布局 RWD 要和「個人首頁的授課單元」一樣。
- 「我的學習」首頁改為：先**選擇書籍**（啟動靈人／啟動豐盛／啟動得勝）→ 排列**該書籍所有課程（課次）**，以卡片方式呈現。
- 用**顏色**區分「已完成填寫分段查經」與「未完成」的課次，引導使用者去填。
- 補齊「啟動靈人」完整 12 課的課次標題與分段查經經文清單（見下方「大綱資料」）。

### 澄清決策（2026-08-28，使用者回覆）

1. **書籍選擇呈現**：首頁列**三張書籍卡片**（啟動靈人／啟動豐盛／啟動得勝），點卡片進入子頁 `/user/{spiritId}/learning/{catalogId}`。未解鎖或設定檔尚無大綱的書籍卡片以**鎖定樣式**呈現、點擊顯示提示、不進子頁。
2. **課次卡片完成度配色（兩態）**：課次「有任一筆分段查經筆記」→ **完成色**；「完全沒有筆記」→ **未完成色**（引導填寫）。**無經文項目的課次（第一課、第十二課）直接視為完成色**（不阻礙整體進度感）。
3. **點課次卡片**：**同頁展開／收合（accordion）**，不換頁；展開區塊顯示該課次的經文項目與既有分段查經筆記 CRUD（沿用 CR-003 既有的新增／編輯／刪除 UI）。
4. **課次標題格式**：全部改為「第 N 課：<標題>」；第二課文字由「開箱上帝所賜的生命之裡」更正為「開箱上帝所賜的生命之禮」。**僅更新顯示文字（`title`），保留既有 `lesson-01`／`lesson-02` 等 `key`**（既有筆記不受影響，比照 CR-003 design 的 key 穩定性規則）。

## What Changes

- **`config/learning-outline.ts`**：
  - 「啟動靈人」（`courseCatalogId = 1`）由 2 課擴充為 **12 課完整大綱**（`lesson-01` ~ `lesson-12`）。`lesson-01`／`lesson-02` 沿用既有 key、僅更新 `title`；`lesson-03` ~ `lesson-12` 為新增（含各自的經文項目 `scriptureKey`）。
  - 新增 helper：`getAllOutlineCatalogIds()` 之外，`getLessonCompletionState()` 相關由資料層負責（見下），設定檔僅維持大綱結構。
- **`lib/data/learning-study.ts`**：新增 `getLessonKeysWithEntries(userId, courseCatalogId): Promise<Set<string>>`（回傳該使用者在該目錄「已有至少一筆筆記」的 `lessonKey` 集合），供課次卡片配色。
- **路由改為兩層**：
  - `/user/{spiritId}/learning`（改寫）：僅本人；顯示**三張書籍卡片**（所有 `CourseCatalog`，依 `sortOrder`），標示鎖定／可進入；卡片牆用 `CourseCardGrid`（與個人首頁授課單元同一 RWD 容器）。
  - `/user/{spiritId}/learning/{catalogId}`（新增）：僅本人；`catalogId` 非法／無大綱 → 導回 `/learning`；未解鎖 → 顯示鎖定訊息、不可填寫；已解鎖 → 課次卡片牆（`CourseCardGrid`）＋ 點卡片 accordion 展開該課次筆記 CRUD。
- **元件**：
  - 新增 `components/learning/learning-catalog-grid.tsx`（client）：三張書籍卡片。
  - 新增 `components/learning/lesson-grid.tsx`（client）：單一目錄的課次卡片牆＋accordion 展開；取代原 `learning-outline-section.tsx` 的「整個目錄全展開」呈現。
  - 抽出 `components/learning/lesson-entries-panel.tsx`（client）：單一課次的「經文項目 → 筆記清單 ＋ 新增表單」（由原 `learning-outline-section.tsx` 內層邏輯搬出）。
  - `study-entry-form.tsx`／`study-entry-card.tsx`／server actions／Zod schema／Prisma 表**不變**（沿用 CR-003）。
- **i18n**：`learning` 命名空間新增書籍卡片頁、鎖定文案、完成／未完成／無需填寫標記、課次進度（X/Y）等 key（`messages/zh-TW.json` 繁體來源 ＋ `messages/en.json`；`zh-CN` 由 `gen:zh-cn` 產生）。
- **`app/[locale]/(user)/user/[spiritId]/page.tsx`**：首頁「我的學習」單元連結不變（仍指向 `/user/{spiritId}/learning`）。
- **文件／版本**：`doc/學員手冊.md` 第八章「我的學習」小節更新為雙層結構與配色說明；`config/version.json` patch +1（apply 時）。

## 大綱資料（啟動靈人，courseCatalogId = 1）

| lessonKey | 課次標題 | 經文項目 |
|---|---|---|
| lesson-01 | 第一課：接受禮物 | （無分段查經） |
| lesson-02 | 第二課：開箱上帝所賜的生命之禮 | 馬可福音一章、路加福音二章、馬太福音二十七章 |
| lesson-03 | 第三課：開啟靈覺（一） | 詩篇一、約翰一書三章、馬可福音十一章 |
| lesson-04 | 第四課：開啟靈覺（二） | 詩篇二十三篇、馬太福音六章、雅各書一章 |
| lesson-05 | 第五課：開啟靈覺（三） | 雅各書二章、雅各書三章、雅各書四章 |
| lesson-06 | 第六課：把屬靈化為實際（一） | 雅各書五章、約翰福音一章、約翰福音二章 |
| lesson-07 | 第七課：把屬靈化為實際（二） | 約翰福音三章、約翰福音四章、約翰福音五章 |
| lesson-08 | 第八課：靈人壓制（一） | 約翰福音六章、約翰福音七章、約翰福音八章 |
| lesson-09 | 第九課：靈人壓制（二） | 約翰福音十一章、約翰福音十二章、約翰福音十三章 |
| lesson-10 | 第十課：脫去舊人，穿上新人 | 約翰福音十四章、約翰福音十五章、約翰福音十六章 |
| lesson-11 | 第十一課：離開才能進入豐盛 | 約翰福音十七章、約翰福音十八章、約翰福音十九章 |
| lesson-12 | 第十二課：靈人全開啟 | （無分段查經） |

## Capabilities

### Modified Capabilities
- `my-learning`：「我的學習」由單頁全展開改為「書籍卡片 → 課次卡片牆（accordion 展開筆記）」兩層結構；課次卡片依分段查經填寫狀態配色；啟動靈人大綱補齊為 12 課。

## Impact

- **Affected code**：
  - 修改：`config/learning-outline.ts`、`lib/data/learning-study.ts`、`app/[locale]/(user)/user/[spiritId]/learning/page.tsx`、`messages/zh-TW.json`／`messages/en.json`、`doc/學員手冊.md`
  - 新增：`app/[locale]/(user)/user/[spiritId]/learning/[catalogId]/page.tsx`、`components/learning/learning-catalog-grid.tsx`、`components/learning/lesson-grid.tsx`、`components/learning/lesson-entries-panel.tsx`
  - 移除：`components/learning/learning-outline-section.tsx`（邏輯拆分至 `lesson-grid` ＋ `lesson-entries-panel`）
- **Database**：**無 schema 變更**（`LearningStudyEntry` 表沿用 CR-003；純新增設定檔內容與 UI）。
- **既有資料**：CR-003 已上 stg 的既有筆記（僅可能落在 `lesson-01`／`lesson-02`）不受影響——key 未變。
- **Route access**：`/user/{spiritId}/learning/{catalogId}` 屬 `(user)` group，layout 已守衛登入；本人守衛於 page 內比照 `/learning`。
- **Dependencies**：無新增套件。

## Open Questions

- 啟動豐盛（`courseCatalogId = 2`）／啟動得勝（`3`）之課次內容本次仍不建置——書籍卡片顯示為「尚未開放」鎖定樣式，待日後於設定檔追加。

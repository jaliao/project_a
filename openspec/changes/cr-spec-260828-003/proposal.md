## Why

需求單 CR-SPEC-260828-003（提出人：廖柏嘉 Justin，2026-08-28）：新增「我的學習」單元，讓學員針對課程大綱（課次 → 經文章節）撰寫「分段式查經」筆記。

需求原文要點：

- 新增「我的學習」的單元。
- **開始上課的學員**才可以開啟該課程的「我的學習」。
- 「我的學習」和「開課（課程）」不綁在一起：隨時可以寫、也可以不寫。
- 可以填寫「分段式查經」，欄位包含：
  - **總標題**（一般文字）
  - **次標題**（副文本）
  - **所領受的話語**（副文本）
  - **運用**（副文本）
- 大綱結構（範例，啟動靈人）：
  - 第一課 —（無經文章節）
  - 第二課 開箱上帝所賜的生命之裡
    - 馬可福音一章
    - 路加福音二章
    - 馬太福音二十七章
- 每一個經文項目都可以填寫分段查經，**記錄填寫時間**，且**可以再寫**（同一項目允許多筆）。

### 澄清決策（2026-08-28，使用者回覆）

1. **大綱來源**：程式碼設定檔（`config/learning-outline.ts`），本次只建置「啟動靈人」的大綱；啟動豐盛／啟動得勝的課次內容待日後補齊。
2. **副文本欄位**：以「多行純文字 `<textarea>`」實作，不導入富文本編輯器（保留換行即可，不做粗體／清單等格式）。
3. **解鎖條件判定範圍**：使用者在「該課程目錄」（如啟動靈人）有**任一已開始的報名**（`status = approved` 且該班 `startedAt` 已設定，含已結業）即解鎖該目錄的「我的學習」。與特定 `CourseInvite` 無綁定。
4. **位置與可見性**：新路由 `/user/{spiritId}/learning`，**僅本人**可存取（比照 `/user/{spiritId}/courses`）。

## What Changes

- **新資料表 `LearningStudyEntry`**（`prisma/schema/learning-study.prisma`，additive migration，正式資料相容）：一筆＝一則分段查經筆記，欄位 `userId`／`courseCatalogId`／`lessonKey`／`scriptureKey`／`mainTitle`／`subTitle`／`wordReceived`／`application`／`createdAt`／`updatedAt`。同一 (user, catalog, lesson, scripture) 允許多筆。
- **新設定檔 `config/learning-outline.ts`**：課程大綱單一事實來源（目錄 → 課次 → 經文項目），本次填入啟動靈人（`courseCatalogId = 1`）第一課（無經文項目）與第二課（三個經文項目）。附型別與查詢 helper。
- **新路由 `app/[locale]/(user)/user/{spiritId}/learning/page.tsx`**：僅本人；非本人導回自己的 learning 頁、未登入導 `/login`。頁面依大綱渲染「已解鎖目錄 → 課次 → 經文項目 → 該項目的筆記清單＋新增」。課次若無經文項目（如第一課）僅顯示標題、無可填寫槽。
- **新 Server Actions `app/actions/learning-study.ts`**：`createStudyEntry`／`updateStudyEntry`／`deleteStudyEntry`，皆驗證 session、驗證 Zod、`create` 另檢查解鎖條件與 `lessonKey`/`scriptureKey` 是否存在於設定檔，`update`/`delete` 檢查該筆 `userId` 屬本人。
- **新資料層 `lib/data/learning-study.ts`**：`getUnlockedLearningCatalogIds(userId)`（回傳有已開始報名的 `courseCatalogId` 陣列）、`getStudyEntriesForUser(userId, catalogId)`（依 `lessonKey::scriptureKey` 分組）。
- **新 Zod schema `lib/schemas/learning-study.ts`**：`mainTitle` 必填（1–200 字）；`subTitle`／`wordReceived`／`application` 選填（各上限 5000 字）。訊息採 `validation.*` key、表單以 `<FieldError>` 呈現（比照 i18n 規範第 12 點「全有全無」）。
- **首頁入口**：`/user/{spiritId}` 首頁新增「我的學習」單元（僅本人可見），標題列連結至 `/user/{spiritId}/learning`。
- **i18n**：新增 `learning` 命名空間至 `messages/zh-TW.json`（繁體來源）與 `messages/en.json`；`zh-CN` 由 `npm run gen:zh-cn` 自動產生。UI 文案不寫死中文。
- **本機開發 seed（選）**：`prisma/seed.ts` 為測試帳號補少量示範筆記，方便本機檢視。

## Capabilities

### New Capabilities
- `my-learning`：「我的學習」分段查經筆記單元（路由存取、解鎖條件、大綱結構、筆記 CRUD、欄位規格）。

### Modified Capabilities
（無）

## Impact

- **Affected code**：
  - 新增：`prisma/schema/learning-study.prisma`、`config/learning-outline.ts`、`lib/schemas/learning-study.ts`、`lib/data/learning-study.ts`、`app/actions/learning-study.ts`、`app/[locale]/(user)/user/[spiritId]/learning/page.tsx`、`components/learning/*`（section／form／entry-card client 元件）
  - 修改：`prisma/schema/user.prisma`（`User.learningStudyEntries` 反向關聯）、`prisma/schema/course-catalog.prisma`（`CourseCatalog.learningStudyEntries` 反向關聯）、`app/[locale]/(user)/user/[spiritId]/page.tsx`（首頁新增單元）、`messages/zh-TW.json`／`messages/en.json`、（選）`prisma/seed.ts`
- **Database**：新增 `learning_study_entries` 表，全為新欄位、不動既有表 → additive、正式資料相容。需 `make schema-update`。
- **Route access**：`/user/{spiritId}/learning` 屬 `(user)` group，layout 已做登入守衛；本人守衛於 page 內處理，不需改 `lib/auth/route-access.ts`。
- **Docs**：依 CLAUDE.md 第 9 點，`doc/學員手冊.md` 新增「我的學習」章節；`config/version.json` patch +1、`updatedAt` 更新（apply 時）。
- **Dependencies**：無新增套件（不導入富文本編輯器）。

## Open Questions

- 啟動靈人完整課次清單（本次僅依需求單建置第一、二課）——待使用者補充後再擴充 `config/learning-outline.ts`，屬純設定檔追加、不需再走 schema。

## Context

- 系統目前**沒有**任何「課次／經文」的資料模型；課程結構只到 `CourseCatalog`（啟動靈人／啟動豐盛／啟動得勝，`seed.ts` 給 id 1／2／3）→ `CourseInvite`（開課）→ `InviteEnrollment`（報名）。
- 「開始上課」＝該 `CourseInvite.startedAt` 非空（`completedAt` 非空代表已結業，仍保有 `startedAt`）。
- 專案**未安裝**任何富文本編輯器套件（tiptap／lexical／quill…）。既有多行輸入皆為原生 `<textarea>` 或 shadcn `Textarea`。
- `/user/{spiritId}/courses` 已有「僅本人」守衛範式：`session.user.spiritId.toLowerCase() !== spiritId` → `redirect` 至本人頁或 `/login`。`(user)` group layout 已負責登入守衛。
- `lib/data/course-sessions.ts` 的 `getMyEnrollments(userId)` 已回傳每筆報名的 `courseCatalogId`／`status`／`startedAt`／`cancelledAt`／`completedAt`，足以推導解鎖目錄。
- 三個 `CourseCatalog` 的名稱在 `lib/auth-roles.ts`（`CATALOG_BY_TEACHER_ROLE` 等）以 id 對應。

使用者已於 2026-08-28 回覆四項關鍵決策（見 proposal「澄清決策」）。

## Goals / Non-Goals

**Goals：**
- 學員可在 `/user/{spiritId}/learning`（僅本人）針對「已解鎖課程目錄」的大綱（課次 → 經文項目），對每個經文項目撰寫多筆「分段查經」筆記，含四欄位與填寫時間。
- 大綱為程式碼設定檔單一事實來源，本次建置啟動靈人。
- 解鎖條件：該課程目錄有任一「已開始」的報名。
- 筆記與特定開課無綁定，隨時可新增／編輯／刪除。

**Non-Goals：**
- 不導入富文本編輯器；副文本欄位＝多行純文字 `<textarea>`（保留換行，不支援格式）。
- 不做大綱的後台管理 UI（新增／排序／編輯課次經文）——純設定檔。
- 本次不建置啟動豐盛／啟動得勝的課次內容（設定檔留空，日後追加）。
- 不提供他人／管理者檢視他人「我的學習」；不列入首頁「學習進度三卡」等公開資訊。
- 課次若無經文項目（如第一課「無」），不提供該課次層級的筆記槽。
- 不與 `LearningRecordFeedback`（學習歷程回饋）功能整合，兩者無關。

## Decisions

### 1. 大綱＝設定檔，不入 DB

`config/learning-outline.ts` 匯出：

```ts
export type ScriptureOutline = { key: string; label: string }
export type LessonOutline = { key: string; order: number; title: string; scriptures: ScriptureOutline[] }
export type CatalogOutline = { courseCatalogId: number; lessons: LessonOutline[] }

export const LEARNING_OUTLINE: Record<number, CatalogOutline> = {
  1: {
    courseCatalogId: 1, // 啟動靈人
    lessons: [
      { key: 'lesson-01', order: 1, title: '第一課', scriptures: [] },
      {
        key: 'lesson-02', order: 2, title: '第二課 開箱上帝所賜的生命之裡',
        scriptures: [
          { key: 'mark-01', label: '馬可福音一章' },
          { key: 'luke-02', label: '路加福音二章' },
          { key: 'matthew-27', label: '馬太福音二十七章' },
        ],
      },
    ],
  },
}
```

Helpers：`getCatalogOutline(catalogId)`、`getLesson(catalogId, lessonKey)`、`getScripture(catalogId, lessonKey, scriptureKey)`、`isValidOutlinePath(catalogId, lessonKey, scriptureKey)`。`key` 一經發布即視為穩定識別（筆記以 key 參照），修改文字（`title`／`label`）不影響既有筆記歸屬。

**理由**：使用者明確選「設定檔＋seed」而非後台模型；大綱變動頻率低、由開發者維護即可，避免為低頻內容建整套 CRUD。

### 2. 資料表 `LearningStudyEntry`（新檔 `prisma/schema/learning-study.prisma`）

```prisma
model LearningStudyEntry {
  id              Int      @id @default(autoincrement())
  userId          String   @db.Uuid
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseCatalogId Int
  courseCatalog   CourseCatalog @relation(fields: [courseCatalogId], references: [id])
  lessonKey       String   // 對應 config 的 LessonOutline.key
  scriptureKey    String   // 對應 config 的 ScriptureOutline.key
  mainTitle       String   // 總標題（一般文字）
  subTitle        String?  // 次標題（多行純文字）
  wordReceived    String?  // 所領受的話語（多行純文字）
  application     String?  // 運用（多行純文字）
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId, courseCatalogId, lessonKey, scriptureKey])
  @@map("learning_study_entries")
}
```

- `User.learningStudyEntries LearningStudyEntry[]`（`prisma/schema/user.prisma`）、`CourseCatalog.learningStudyEntries LearningStudyEntry[]`（`prisma/schema/course-catalog.prisma`）反向關聯。
- **多筆**：同一 `(userId, courseCatalogId, lessonKey, scriptureKey)` 允許多列（「也可以再寫」），各自 `createdAt`／`updatedAt`。無 `@@unique`。
- `onDelete: Cascade`（隨帳號刪除移除）；`courseCatalogId` FK 保留參照完整性。
- Additive：不改任何既有表 → 正式資料相容。

### 3. 解鎖條件

`getUnlockedLearningCatalogIds(userId)`：取 `getMyEnrollments(userId)`，過濾 `status === 'approved' && !cancelledAt && (startedAt || completedAt)`，回傳 distinct `courseCatalogId`。

- learning 頁只渲染「已解鎖且設定檔有大綱」的目錄。目前唯一有大綱的是啟動靈人（id 1）。
- 未解鎖 → 頁面顯示空狀態說明「需先開始上課才能使用」。
- `createStudyEntry` 於 server 端**重新驗證**目標 `courseCatalogId` 在解鎖集合內，未解鎖直接拒絕（防繞過 UI）。
- 解鎖是**即時**判定：課程結業後 `startedAt` 仍在 → 仍解鎖，可繼續補寫（符合「隨時可以寫」「不綁課程」）。

### 4. 路由與守衛

`app/[locale]/(user)/user/[spiritId]/learning/page.tsx`（server component）：

1. `const session = await auth()`；`session.user.spiritId.toLowerCase() !== spiritId` → `redirect(selfId ? '/user/{selfId}/learning' : '/login')`（比照 `/courses`）。
2. 查 `user.id`；查不到 → `redirect('/login')`。
3. `getUnlockedLearningCatalogIds(user.id)` ∩ `Object.keys(LEARNING_OUTLINE)` → 要渲染的目錄。
4. 對每個目錄 `getStudyEntriesForUser(user.id, catalogId)`（回傳 `Map<'lessonKey::scriptureKey', LearningStudyEntry[]>`，排序 `createdAt asc`）。
5. 渲染：目錄標題 → 課次（`title`）→ 經文項目（`label`）→ 該項目筆記卡片清單 ＋「新增分段查經」按鈕。課次 `scriptures` 為空 → 只顯示課次標題。
6. 頂部「返回學員頁面」連結至 `/user/{spiritId}`。

不需改 `lib/auth/route-access.ts`（非公開頁，`(user)` layout 已守衛登入）。

### 5. Server Actions（`app/actions/learning-study.ts`，標準 `ActionResponse`）

- `createStudyEntry(input: { courseCatalogId, lessonKey, scriptureKey, mainTitle, subTitle?, wordReceived?, application? })`
  1. `auth()`；未登入拒絕。
  2. `learningStudyEntrySchema.safeParse`（Zod）。
  3. `isValidOutlinePath(courseCatalogId, lessonKey, scriptureKey)` 為真（且該 scripture 存在，非空課次）。
  4. `courseCatalogId ∈ getUnlockedLearningCatalogIds(session.user.id)`。
  5. `prisma.learningStudyEntry.create`。
  6. `revalidatePath('/[locale]/user/[spiritId]/learning', 'page')`。
- `updateStudyEntry(id, input)`：`auth()` → 讀該筆確認 `userId === session.user.id`（否則 `{ success:false, message:'無權限' }`）→ Zod → `update`（僅四個內容欄位）→ revalidate。
- `deleteStudyEntry(id)`：`auth()` → 擁有權檢查 → `delete` → revalidate。
- 更新／刪除不重驗解鎖條件（已擁有的筆記允許持續維護，符合「不綁課程」）。

### 6. Zod schema（`lib/schemas/learning-study.ts`）

```ts
export const learningStudyEntrySchema = z.object({
  courseCatalogId: z.number().int().positive(),
  lessonKey: z.string().min(1),
  scriptureKey: z.string().min(1),
  mainTitle: z.string().trim().min(1, 'validation.studyMainTitleRequired').max(200, 'validation.studyMainTitleTooLong'),
  subTitle: z.string().trim().max(5000, 'validation.studyFieldTooLong').optional().or(z.literal('')),
  wordReceived: z.string().trim().max(5000, 'validation.studyFieldTooLong').optional().or(z.literal('')),
  application: z.string().trim().max(5000, 'validation.studyFieldTooLong').optional().or(z.literal('')),
})
```

表單（client）以 React Hook Form + `zodResolver`，錯誤以 `<FieldError message={errors.x?.message} />` 呈現（訊息為 key，內部 `t()`）。server action 回傳的 `errors` 亦為 key。

### 7. UI 元件（`components/learning/`）

- `learning-outline-section.tsx`（client）：接收單一目錄的大綱 ＋ 已分組筆記，渲染課次／經文／筆記清單，管理「新增／編輯中」的表單開合狀態。
- `study-entry-form.tsx`（client）：四欄位表單（總標題 `<input>`、其餘 `<textarea>`），用於新增與編輯；`onSubmit` 呼叫對應 server action，toast 成功／失敗。
- `study-entry-card.tsx`（client）：顯示一筆筆記（四欄位、`createdAt` 填寫時間、若 `updatedAt > createdAt` 顯示「已編輯」），提供「編輯」「刪除」（刪除走 `AlertDialog` 二次確認）。
- 首頁單元：`/user/[spiritId]/page.tsx` 於 `isOwnPage` 時新增一個 `rounded-lg border p-5` 區塊，標題列 `IconNotebook`＋「我的學習」＋`IconChevronRight`，整列 `Link` 至 `/user/${id}/learning`（比照「聯繫管理者」單元作法）。

### 8. i18n

新增 `learning` 命名空間（`messages/zh-TW.json` 繁體來源、`messages/en.json` 英文）：頁面標題、返回連結、課次／經文標籤前綴、四欄位標籤（總標題／次標題／所領受的話語／運用）、按鈕（新增分段查經／儲存／取消／編輯／刪除）、刪除確認文案、填寫時間標籤、已編輯標記、未解鎖空狀態、無筆記空狀態。驗證訊息加於 `validation.*`（`studyMainTitleRequired`／`studyMainTitleTooLong`／`studyFieldTooLong`）。`zh-CN` 由 `npm run gen:zh-cn` 產生，不手改。元件不寫死中文。

## Risks / Trade-offs

- **[風險] 設定檔 `key` 被改動導致既有筆記「孤兒」**：以文件註記「key 發布後不可變更，只能改顯示文字或新增」約束；查詢時對 `lessonKey`/`scriptureKey` 找不到大綱者，頁面歸入「其他（大綱已調整）」區塊顯示、不隱藏資料（避免使用者以為筆記遺失）。
- **[風險] 副文本用純 textarea，日後若要富文本需資料遷移**：可接受——目前欄位存純文字，日後導入編輯器可漸進（存 HTML/JSON 另立欄或就地相容），本次不預先設計。
- **[取捨] 大綱不入 DB**：啟動豐盛／得勝內容補齊需改 code + 部署；符合使用者選擇，且內容穩定、頻率低。
- **[風險] `getMyEnrollments` 對報名多的使用者查詢成本**：learning 頁一次載入，資料量小（單一使用者報名數個位數），可接受；必要時 `lib/data/learning-study.ts` 內改為針對性 `groupBy` 查詢。

## Migration Plan

1. `prisma/schema/learning-study.prisma` 新增 model ＋ 兩個既有 model 加反向關聯 → `make schema-update name=add_learning_study_entries`（新表，additive）。
2. `config/learning-outline.ts`、`lib/schemas/learning-study.ts`、`lib/data/learning-study.ts`、`app/actions/learning-study.ts`。
3. 路由頁 ＋ `components/learning/*` 三個 client 元件。
4. `/user/[spiritId]/page.tsx` 首頁單元入口。
5. `messages/zh-TW.json`／`messages/en.json` 新增 `learning` 命名空間與 `validation` 三個 key。
6. （選）`prisma/seed.ts` 為測試帳號補示範筆記。
7. `npm run lint` ＋ `npm run build`。
8. `doc/學員手冊.md` 新增「我的學習」章節；`config/version.json` patch +1、`updatedAt`。

**Rollback**：新表未被既有流程參照，`prisma migrate` 反向 drop table 即可；程式碼 revert commit。無既有資料異動。

## 1. 資料層（`lib/data/learning-study.ts`）

- [x] 1.1 新增 `getFilledOutlineSlots(userId, courseCatalogId): Promise<Set<string>>`：`prisma.learningStudyEntry.findMany({ where: { userId, courseCatalogId }, select: { lessonKey: true, scriptureKey: true }, distinct: ['lessonKey', 'scriptureKey'] })`，回傳 `new Set(rows.map(r => outlineSlotKey(r.lessonKey, r.scriptureKey)))`
- [x] 1.2 移除 `getLessonKeysWithEntries`（`grep` 確認呼叫端僅兩個 learning 路由頁，皆已改用 1.1）
- [x] 1.3 `getUnlockedLearningCatalogIds`／`getStudyEntriesForUser`（組內 `createdAt asc`，供「最早一筆」語意）／`outlineSlotKey` 不變

## 2. Server actions（`app/actions/learning-study.ts`）

- [x] 2.1 `createStudyEntry`：驗證段（session／`createStudyEntrySchema`／`isValidOutlinePath`／`getUnlockedLearningCatalogIds` 已解鎖）維持不變
- [x] 2.2 `createStudyEntry`：驗證通過後改為 idempotent——`findFirst` 該 `(userId, courseCatalogId, lessonKey, scriptureKey)` 依 `createdAt asc` 取最早一筆；`existing` 存在 → `update({ where: { id }, data: normalizeContent(d) })`；否則 `create`。回傳 `{ success: true, message: '已儲存' }`，成功後 `revalidateLearning()`
- [x] 2.3 `updateStudyEntry(id, input)`：不變（擁有者檢查 → `studyEntryContentSchema` → `update` → `revalidateLearning`）
- [x] 2.4 `grep -rn "deleteStudyEntry"` 確認呼叫端僅 `study-entry-card.tsx`；移除該呼叫後刪除 `deleteStudyEntry` export（無後台匯入／修正工具引用）

## 3. `components/learning/study-entry-form.tsx`

- [x] 3.1 型別重構：移除 `CommonProps`；`onDone`／`onCancel` 移入 `EditProps`；`CreateProps` 僅保留 `mode: 'create'`／`courseCatalogId`／`lessonKey`／`scriptureKey`
- [x] 3.2 `create` 模式：不渲染「取消」按鈕（表單常駐）；送出成功 `toast.success(res.message)`，不呼叫 `onDone`（頁面靠 `revalidatePath` 重繪為檢視卡）
- [x] 3.3 `edit` 模式：維持「儲存＋取消」，成功後 `onDone()`、取消 `onCancel()`
- [x] 3.4 欄位（`<Input>` 總標題 ＋ 3 `<Textarea>`）、`zodResolver(studyEntryContentSchema)`、`<FieldError>`、`useTranslations('learning')` 不變

## 4. `components/learning/study-entry-card.tsx`

- [x] 4.1 移除刪除 UI：`import { deleteStudyEntry }`、`AlertDialog*` import、`IconTrash`、`toast`、`handleDelete`、`useTransition`
- [x] 4.2 保留 `IconPencil` → `setEditing(true)` → 內嵌 `<StudyEntryForm mode="edit" entryId initial onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />`
- [x] 4.3 版面對齊 `InquiryCard` 級距：外層 `space-y-2`（不自帶 `border p-4`，外框由呼叫端提供）；`mainTitle` `text-sm font-medium`；`Field` 內文 `whitespace-pre-wrap text-sm`、label `text-xs font-medium text-muted-foreground`；時間列 `text-xs text-muted-foreground`（`filledAtLabel` ＋ `isEdited` 時 `edited` ＋ `updatedAtLabel`）
- [x] 4.4 「編輯」以 `size="icon" variant="ghost"` 小按鈕呈現，`aria-label={t('edit')}`

## 5. `components/learning/lesson-entries-panel.tsx`（改寫）

- [x] 5.1 `props` 不變（`courseCatalogId`／`lesson`／`entriesBySlot`）；移除 `useState`／`openSlot`、`IconPlus`、`Button`、`t('addEntry')`／`t('noEntries')`
- [x] 5.2 `lesson.scriptures.length === 0` → `<p className="text-sm text-muted-foreground">{t('noScripture')}</p>`
- [x] 5.3 否則渲染 `<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">`，逐 `scripture` 一格 `<div className="space-y-2 rounded-lg border p-4">`：頂部 `scripture.label`（`text-sm font-medium`）；`entry = (entriesBySlot[`${lesson.key}::${scripture.key}`] ?? [])[0] ?? null`（inline slot key，避免 client 端引入 data layer）；`entry` → `<StudyEntryCard entry={entry} />`，否則 `<StudyEntryForm mode="create" courseCatalogId lessonKey={lesson.key} scriptureKey={scripture.key} />`
- [x] 5.4 多筆時只取 `[0]`（`getStudyEntriesForUser` 已 `createdAt asc`），其餘不渲染

## 6. `components/learning/lesson-grid.tsx`

- [x] 6.1 移除本地 `LessonState`／`lessonState`；改用 `config/learning-outline.ts` 的 `LessonFillState`／`lessonFillState`（四態 `'noScripture' | 'todo' | 'partial' | 'done'`）
- [x] 6.2 `lessonFillState` 抽到 `config/learning-outline.ts`（純函式，輸入 `LessonOutline` + `Set<string>`）：`total===0` → `noScripture`；`filled===0` → `todo`；`filled<total` → `partial`；else `done`
- [x] 6.3 prop 由 `lessonKeysWithEntries: string[]` 改名 `filledSlots: string[]`（內部 `new Set(filledSlots)`）
- [x] 6.4 四態徽章與邊框：`noScripture`／`done` 用完成色（`border-green-500/60`；Badge 分別 `variant="secondary"`／`bg-green-600 text-white`）；`partial` `border-amber-400` ＋「填寫中」Badge（`bg-amber-500 text-white`）；`todo` `border-dashed border-amber-400` ＋「待填寫」Badge（`variant="outline"` 琥珀）。文案 `t('lessonNoScripture')`／`t('lessonDone')`／`t('lessonPartial')`／`t('lessonTodo')`
- [x] 6.5 accordion 展開行為（`useState<string | null>`、至多一課、`IconChevronDown` 旋轉、展開者 `ring-2 ring-primary`、panel 於 grid 下方等寬區塊）不變

## 7. 路由頁

- [x] 7.1 `app/[locale]/(user)/user/[spiritId]/learning/[catalogId]/page.tsx`：`getLessonKeysWithEntries` → `getFilledOutlineSlots`；`doneCount = outline.lessons.filter(l => isLessonCompleted(l, filledSlots)).length`；`<LessonGrid outline entriesBySlot filledSlots={[...filledSlots]} />`；孤兒筆記各以 `rounded-lg border bg-card p-4` 包 `StudyEntryCard`；守衛／redirect／`catalogLocked` 不變
- [x] 7.2 `app/[locale]/(user)/user/[spiritId]/learning/page.tsx`：每個可進入目錄改呼叫 `getFilledOutlineSlots`（沿用既有 `Promise.all` map）；`doneCount` 用 `isLessonCompleted`；`LearningCatalogGrid` props（`doneCount`／`totalCount`）不變
- [x] 7.3 `lessonFillState` ＋ `isLessonCompleted` 抽到 `config/learning-outline.ts` 的純函式，`lesson-grid.tsx`／兩頁共用，無三份複製

## 8. i18n

- [x] 8.1 `messages/zh-TW.json` `learning`：新增 `lessonPartial: "填寫中"`；`lessonDone` 由 `"已填寫"` 改為 `"已完成"`；`noScripture` 文案改「本課次無分段查經。」
- [x] 8.2 `messages/zh-TW.json` `learning`：移除 `noEntries`、`addEntry`、`delete`、`deleteConfirmTitle`、`deleteConfirmBody`、`deleteConfirmAction`（`grep` 確認 `learning` 命名空間內已無引用）
- [x] 8.3 `messages/en.json` 同步（`lessonPartial: "In progress"`、`lessonDone: "Completed"`、`noScripture` 改文案、移除對應 key）
- [x] 8.4 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`；所有 learning 元件文案皆 `useTranslations('learning')`／`getTranslations('learning')`，無寫死中文

## 9. 驗證

- [x] 9.1 `npm run lint`：0 error（16 個既有 warning，皆非本次檔案）
- [x] 9.2 `npx tsc --noEmit`：0 error（含 `study-entry-form.tsx` 型別重構後 `study-entry-card.tsx` 的 `mode="edit"` 呼叫）
- [x] 9.3 `npm run build`（含 prebuild `gen:zh-cn`）：`✓ Compiled successfully`，`/user/[spiritId]/learning` 與 `/learning/[catalogId]` 皆正常產出
- [~] 9.4 **（待人工實測，部署後）** 四態顯示與「X / 共 12 課」＝（已完成 + 無需填寫）——結構面由 `lessonFillState`／`isLessonCompleted` 純函式與 `tsc`／`build` 保證；需以已解鎖帳號實測配色
- [~] 9.5 **（待人工實測）** 展開一課直接見三格（未填為表單、已填為檢視卡）、無「新增」按鈕；填一格 → 轉檢視卡、徽章 待填寫→填寫中
- [~] 9.6 **（待人工實測）** 檢視卡有「編輯」、無刪除按鈕；編輯後標「已編輯」＋更新時間
- [~] 9.7 **（待人工實測）** 對已有筆記的格子重送 `createStudyEntry` → 不產生第二筆——由 action 內 `findFirst` + `update` 分支保證，需 dev 站併發/過期頁情境覆核
- [~] 9.8 **（待人工實測）** 迴歸：`/learning` 三張書籍卡片、四態進度數；未解鎖／非法 `catalogId`／未登入 redirect 與鎖定訊息不變（該段 code 未改）；孤兒區塊仍可編輯、無刪除
- [~] 9.9 **（待人工實測）** RWD：展開 panel 三格窄螢幕單欄、`sm` 以上三欄（`grid-cols-1 sm:grid-cols-3`，同「聯繫管理者」）

## 10. 文件與版本號同步

- [x] 10.1 `doc/學員手冊.md` 第八章「我的學習（分段查經）」小節改寫為四態 ＋ 展開直接三格表單 ＋ 存檔轉檢視卡片、可改不可刪、一格一筆；檔首版本 v0.1.181 → v0.1.182（2026-08-28）
- [x] 10.2 `doc/老師手冊.md`／`doc/管理者操作手冊.md`：`grep` 確認無「分段查經」／「我的學習」內容，不需更新
- [x] 10.3 `config/version.json`：`0.1.181` → `0.1.182`，`updatedAt` `2026-08-28`

## 0. 實作歷程（3 輪迭代，記錄供之後參考，不代表待辦）

- **第 1 輪**（已捨棄）：對話框掛在結業頁，送出成功後 `setShowCertDialog(true)` 不導頁。人工實測失敗——送出後立刻被導回課程詳情頁，對話框沒機會顯示。定位根因：結業頁 `page.tsx` 有「已結業→導回詳情頁」的伺服器端 `redirect()` 守衛；呼叫 `graduateCourse`（Server Action）本身會讓 Next.js 對「呼叫當下所在的路徑」（結業頁）觸發隱含的 Server Component 重新渲染，結業送出後 `completedAt` 已設，隱含重新渲染立刻命中該守衛把整頁換掉——早於對話框顯示，且與 `revalidatePath` 呼叫與否無關（曾嘗試移除 `revalidatePath('/course/${inviteId}/graduate')`，問題依舊）。
- **第 2 輪**（已捨棄）：對話框改掛在課程詳情頁，結業頁送出成功後一律立即導頁（有已結業學員時帶 `?justGraduated=1`），由課程詳情頁（`course-detail-actions.tsx`）以 `useSearchParams()` 偵測並顯示。技術上可行（lint／build 皆過），但使用者希望對話框仍顯示在結業頁本身，故再次調整。
- **第 3 輪（最終採用）**：移除結業頁 `page.tsx` 的「已結業→導離」伺服器端守衛，改用 `alreadyCompleted` prop 交給 `GraduationForm` 自行處理；`GraduationForm` 以 `useState(alreadyCompleted)`（掛載當下的快照值，非每次渲染重新推導）鎖定「進入本頁當下是否已結業」，之後結業送出觸發的隱含重新渲染即使帶來新的 `alreadyCompleted=true`，也不影響已在進行中的表單／對話框狀態機。對話框、確認按鈕與導頁邏輯全部留在結業頁本身。

## 1. UI（最終架構）

- [x] 1.1 `app/[locale]/(user)/course/[id]/graduate/page.tsx`：移除 `if (course.completedAt) { redirect(...) }`；`<GraduationForm>` 新增傳入 `alreadyCompleted={!!course.completedAt}`
- [x] 1.2 `graduation-form.tsx`：`Props` 新增 `alreadyCompleted: boolean`；新增 `const [initiallyCompleted] = useState(alreadyCompleted)`；渲染最前面新增分支——`initiallyCompleted` 為真時顯示「此課程已結業」訊息＋返回課程詳情頁按鈕，不顯示表單
- [x] 1.3 `graduation-form.tsx`：新增 `showCertDialog` state（預設 `false`）；`handleSubmit` 成功分支依 `graduatedStudents.length > 0` 分流——有已結業學員時 `setShowCertDialog(true)`（不導頁），否則維持原行為（`toast.success` + 立即 `router.push`）
- [x] 1.4 `graduation-form.tsx`：新增提示 Dialog（`components/ui/dialog.tsx`），標題／說明文字用 `t('certDialogTitle')`／`t('certDialogMessage')`，單一確認按鈕 `t('certDialogConfirm')`，點擊後 `router.push('/course/${inviteId}')`；不提供背景點擊／Esc 關閉逃逸（`onInteractOutside`/`onEscapeKeyDown` 皆 `preventDefault`、`showCloseButton={false}`、`onOpenChange={() => {}}`）
- [x] 1.5 `app/actions/course-invite.ts` 的 `graduateCourse`：更新 `revalidatePath` 處註解，說明結業頁已不再因 `completedAt` 而 redirect，故該頁是否 revalidate 已與對話框顯示無關（維持不 revalidate 結業頁本身，因該頁 `force-dynamic`，不影響正確性）
- [x] 1.6（還原第 2 輪的暫時改動）`course-detail-actions.tsx`：移除 `useSearchParams()`／`justGraduated` 偵測／`showCertDialog` state／提示 Dialog JSX／`tGrad` 命名空間 hook，回復為本次改動前的原始版本
- [x] 1.7（還原第 2 輪的暫時改動）`app/[locale]/(user)/course/[id]/page.tsx`：移除 `<CourseDetailActions>` 外層的 `<Suspense>` 包裹與 `import { Suspense } from 'react'`（`course-detail-actions.tsx` 已不再使用 `useSearchParams()`，不需要）

## 2. i18n

- [x] 2.1 `messages/zh-TW.json` 的 `course.gradForm` 命名空間新增：`certDialogTitle`（將會為您製作證書）、`certDialogMessage`（依使用者要求調整文字，明確告知「接下來系統將為已結業學員製作結業證書」）、`certDialogConfirm`（確認按鈕文案）、`alreadyCompleted`（已結業提示文字）、`backToDetail`（返回課程詳情頁按鈕文案）
- [x] 2.2 補齊 `messages/en.json` 對應翻譯；執行 `npm run gen:zh-cn` 產生簡體

## 3. 驗證

- [x] 3.1 `npm run lint`（0 errors，僅既有與本次無關的 warnings）
- [x] 3.2 `npm run build`（Compiled successfully，TypeScript 無錯誤）
- [x] 3.3 `npx tsc --noEmit`（0 錯誤）
- [x] 3.4 手動驗證（**第三輪，架構已調整回結業頁本身**）：至少一位學員已結業時送出 → **停留在結業頁**顯示「將會為您製作證書」對話框、點確認才導回課程詳情頁；全員未結業時送出 → 直接顯示成功 toast 並導回，不顯示對話框；送出中「確認送出」按鈕仍正確禁用防重複送出；直接造訪已結業課程的 `/course/[id]/graduate`（例如瀏覽器上一頁／書籤）應顯示「此課程已結業」訊息，不應顯示表單、也不應被強制導離
- [x] 3.5 依 CLAUDE.md 規範同步 `doc/老師手冊.md`〈九、辦理結業〉「送出」步驟文字（v0.1.202；本輪對話框改回停留在結業頁本身，措辭同步調整）、`config/version.json`（0.1.201→0.1.202）、`README-AI.md` 版本行、`ai-context/07-current-tasks.md` 更新本次 CR 記錄以反映第 3 輪最終架構

## Context

結業表單（`app/[locale]/(user)/course/[id]/graduate/graduation-form.tsx`）的送出結業（`handleSubmit`）目前送出成功後只 `toast.success` 並立即 `router.push` 回課程詳情頁。已結業學員會自動出現在「待製作證書清單」（`admin-certificate-production`），但講師端沒有任何提示告知這件事，容易讓講師誤以為流程到此結束。

## Goals / Non-Goals

**Goals:**
- 送出結業成功、且本次有學員被標記為已結業時，明確告知講師「將會為您製作證書」，並讓講師需主動確認才離開頁面，避免訊息被忽略
- 全員未結業（無人獲得結業證明）時不顯示此提示，維持原有簡潔行為

**Non-Goals:**
- 不改變 `graduateCourse` server action 或證書製作（`CertificateProduction`）的既有邏輯與資料模型
- 不在此提示對話框內提供任何證書相關操作（如立即前往證書製作頁），純粹是資訊性告知
- 不處理管理者端「待製作證書清單」頁面的顯示邏輯（該頁既有行為不變）

## Decisions

### 1. 以「本次是否有已結業學員」決定是否顯示提示，而非固定顯示
`graduation-form.tsx` 已有 `graduatedStudents`（依 `studentStates[userId].graduated` 篩選）可直接複用，送出成功後用 `graduatedStudents.length > 0` 判斷。理由：證書製作僅發生在已結業學員身上（見 `admin-certificate-production` 「待製作證書清單」來源為 `graduatedAt != null`），全員未結業時顯示「將會為您製作證書」會誤導使用者。

### 2. 提示以 Dialog（非 AlertDialog）呈現，僅一顆確認按鈕
單純資訊性告知、非破壞性操作確認，不需要「取消」選項；沿用專案既有 `components/ui/dialog.tsx`（比照 `GenderPromptDialog` 等單按鈕告知型 Dialog 的用法）。不提供背景點擊關閉逃逸（`onInteractOutside`/`onEscapeKeyDown` 皆 `preventDefault`），確保訊息被看到。

### 3.（第一次修正、已再修正，見下）提示對話框一度改掛在課程詳情頁
**原始設計**（送出成功後停留在結業頁顯示 Dialog、確認後才 `router.push`）在第一輪人工實測中失敗：使用者反應「還來不及按對話框就被轉回課程詳情頁」。

**根因**：結業頁 `graduate/page.tsx` 本身有伺服器端守衛「`if (course.completedAt) redirect('/course/${numId}')`」。呼叫 `graduateCourse`（Server Action）這件事本身，會讓 Next.js 對「呼叫當下所在的路徑」（即結業頁）自動觸發一次 Server Component 重新渲染（等同隱含 `router.refresh()`），且這個行為**不是**由本頁自己呼叫 `revalidatePath` 所引發、也無法靠移除該呼叫來避免（實測移除 `revalidatePath('/course/${inviteId}/graduate')` 後問題依舊存在）。結業送出後 `completedAt` 已設，這次自動重新渲染立刻命中該守衛並把整頁換掉，早於任何掛在本頁的 client 端 Dialog 有機會顯示或被點擊——本頁「已結業即導離」的伺服器端守衛與「送出成功後在本頁顯示提示」這兩件事在架構上互斥，無法在同一頁面上同時成立。

**第二次嘗試**（已捨棄）：送出成功後一律立即導頁，有已結業學員時導向 `/course/${inviteId}?justGraduated=1`；提示對話框改掛在課程詳情頁（`course-detail-actions.tsx`），以 `useSearchParams()` 讀取 query flag 顯示。技術上可行（已實測 build／lint 通過），但使用者回饋希望對話框仍顯示在結業頁本身（送出當下所在的頁面），故再次調整。

### 4.（最終定案）移除結業頁的伺服器端「已結業→導離」守衛，對話框留在結業頁本身
既然問題根源是「呼叫 Server Action 本身就會讓當前頁面的 Server Component 隱含重新渲染」，而不是某次 `revalidatePath` 呼叫造成，那麼只要**結業頁的 Server Component 在重新渲染時不再拋出 `redirect()`**，這個隱含重新渲染就不會變成強制導頁，Client Component（`GraduationForm`）也就能在原地存活並正常顯示 Dialog。

做法：
- `graduate/page.tsx` 移除 `if (course.completedAt) { redirect(...) }`，改為一律渲染 `<GraduationForm>`，並多傳一個 `alreadyCompleted={!!course.completedAt}` prop（描述「進入本頁當下，此課程是否已結業」）。
- `GraduationForm` 內以 `const [initiallyCompleted] = useState(alreadyCompleted)`（**無 setter 呼叫、純粹作為「掛載當下快照」**）鎖定這個值：若為 `true`（使用者是直接造訪一個早已結業課程的結業頁），提前 return 顯示「此課程已結業」訊息＋返回按鈕，不顯示表單；若為 `false`，照常顯示三步驟表單。
- 結業送出（`handleSubmit`）成功後，若有已結業學員：`setShowCertDialog(true)`，**不導頁**，讓 Dialog 顯示在結業頁上；確認按鈕才 `router.push('/course/${inviteId}')`。若無已結業學員：沿用原行為，`toast.success` 後立即 `router.push`。
- 送出後結業頁 `page.tsx` 仍會因 Server Action 而隱含重新渲染、`course.completedAt` 也確實變為 `true`、新的 `alreadyCompleted` prop 也會是 `true`——但因為 `initiallyCompleted` 只在掛載當下取值一次（`useState(alreadyCompleted)` 不是 `useState(() => alreadyCompleted)` 的差異在此不重要，關鍵是它是「初始值」而非每次渲染都重新評估的衍生值），元件不會因為新 prop 而重新走一次「已結業提前 return」的分支，Dialog 與整個表單狀態機得以在原地保持穩定。
- 因此，本次不再需要 `course-detail-actions.tsx` 的 `useSearchParams()`／query flag／`<Suspense>` 包裹（皆已還原移除），架構回到單一頁面自足。

## Risks / Trade-offs

- [風險] 多一個確認步驟可能被部分使用者視為多餘的阻擋 → 緩解：僅在真的有證書要製作時才顯示，且只需一次點擊即可關閉，成本很低。
- [風險] `initiallyCompleted` 以掛載當下的 prop 值鎖定，若同一頁面在極端情境下因其他原因（例如瀏覽器分頁長時間停留、其他分頁修改了同一課程狀態）導致 `alreadyCompleted` prop 之後才變 `true`，本頁仍會依掛載當下的舊值繼續顯示表單 → 影響輕微：`graduateCourse` server action 本身仍會在真正執行寫入前重新檢查 `invite.completedAt`（見既有邏輯 `if (invite.completedAt) return { success: false, message: '課程已結業' }`），資料正確性不受影響，使用者僅會在送出時收到「課程已結業」的錯誤提示而非提前被導離。

## Migration Plan

不需要 migration，純前端行為調整（歷經兩次架構修正：提示對話框最終仍留在結業頁本身，改為移除該頁「已結業→導離」的伺服器端 redirect 守衛），可直接隨版本上線。

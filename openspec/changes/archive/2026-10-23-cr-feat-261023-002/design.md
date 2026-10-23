## Context

`/course/[id]` 的 `ApprovedStudentsSection`（`app/[locale]/(user)/course/[id]/approved-students-section.tsx`）目前渲染已核准學員卡片給**任何能開啟課程詳情頁的登入使用者**——`canManage`（`isInstructor || isAdmin`）僅控制卡片區塊標題列的「新增學員」「移除學員」管理按鈕與移除模式，卡片清單本身的渲染（`page.tsx` 第 407 行起）並未依身分分支。

目標頁 `/user/[spiritId]`（`app/[locale]/(user)/user/[spiritId]/page.tsx`）同樣沒有「僅本人或僅管理者可看」的守衛：`isOwnPage`／`isAdmin` 僅用於決定是否顯示編輯用的 UI（如暱稱/性別設定彈窗），頁面主體資料查詢以 URL 的 `spiritId` 為準，對任何登入者皆回傳相同內容。

## Goals / Non-Goals

**Goals:**
- 讓課程詳情頁的已核准學員卡片可點擊，連到該學員會員首頁。
- 不因此新增任何目前不存在的資料外露範圍。

**Non-Goals:**
- 不重新設計 `/course/[id]` 或 `/user/[spiritId]` 的既有權限模型（兩者目前「任何登入者可見」皆為既有設計，非本次變更範圍）。
- 不處理移除模式下卡片是否也要可點擊——決定維持不可點擊，理由見 Decisions。

## Decisions

### 1. 可見與可點擊範圍：與現狀卡片可見範圍一致（所有登入後能看到此頁的使用者）

與使用者確認後採用此方案。依據：
- 已核准學員卡片清單本身的渲染本就不依 `isInstructor || isAdmin` 分支（見 Context），該資訊（姓名、教材選擇、加入時間）對所有能開啟此頁的登入者早已可見。
- 連結目標頁 `/user/[spiritId]` 本身無權限守衛，任何登入者本來就能透過直接輸入網址開啓任一會員首頁。
- 因此新增的點擊連結只是把「已經可見的姓名」與「已經可達的頁面」之間補上一個捷徑，不產生新的可見範圍或新的可達頁面。

**Alternative considered（僅管理者／該課講師可點擊）**：放棄，因為會造成「一般學員看到卡片卻不能點、要點的話自己去猜網址一樣能到」的不一致體感，且不會縮小實際可觸及的資料範圍（目標頁本身沒有守衛）。若未來 `/user/[spiritId]` 收緊權限（例如改為僅本人/管理者可見），此處的可點擊範圍應同步重新評估。

### 2. 移除模式下卡片不可點擊

移除模式（`removeMode = true`）僅管理者／該課講師可進入，此時卡片內會出現「移除」按鈕（`RemoveStudentButton`）。若卡片整體仍是 `<a>`／`Link`，瀏覽器會出現可互動元素巢狀（`<a>` 包 `<button>`）且點擊移除按鈕的事件可能被外層連結的導航攔截或產生非預期的 tab 順序。做法：`removeMode` 為真時，卡片保持目前的 `<li>`（非連結）渲染，僅在 `!removeMode` 時才用 `Link` 包裹卡片內容。

### 3. `spiritId` 為 null 時不可點擊

理論上已核准學員必有帳號（`InviteEnrollment` 關聯的 `User` 必存在）故必有 `spiritId`（除非該會員從未登入過、尚未核發 — 需與 `MemberHomeLink` 的防呆邏輯一致）。比照 `member-home-link.tsx` 的作法：`spiritId` 為 `null`／空字串時不產生連結、卡片維持純顯示。

### 4. 卡片新增性別／教會顯示：範圍、未填呈現、樣式

與使用者確認後採用以下三項決定：

- **可見範圍**：與卡片既有可見範圍一致——所有能開啟此課程詳情頁的登入使用者皆可見，不限管理者／該課講師。理由同 Decision 1：該資料在 `/user/[spiritId]` 本身即無守衛，任何登入者本來就能透過已存在的連結（本次 CR 新增）或直接輸入網址查得，卡片上顯示不產生新的外露範圍。
- **未填寫時的呈現**：`gender === 'unspecified'` 時不渲染性別圖示；`churchType === 'none'`（或 `church`/`churchOther` 解析結果為空）時不渲染教會文字／該行。與 `/user/[spiritId]` 詳情頁顯示「未設定」的做法不同——詳情頁是「本人+管理者編輯情境」需要明確呈現「尚未填寫」以提示補填，課程卡片是多人列表瀏覽情境，未填欄位直接留空可避免每張卡片都塞一排「未設定」造成視覺雜訊。
- **顯示樣式**：性別僅顯示圖示（重用 `components/shared/gender-icon.tsx` 的 `GenderIcon`，不額外加文字標籤，緊接於姓名後，沿用該元件既有的 `aria-label` 供無障礙辨識）；教會僅顯示純文字（沿用 `churchType` 三態解析出的教會名稱或自填文字），因教會沒有對應圖示可用，置於**姓名列上方**（與使用者確認後的排版決定）。兩者皆不加「性別：」「教會：」之類的前綴標籤文字。

**資料與型別**：
- `lib/data/course-sessions.ts` 的 `getCourseSessionById`（`enrollments.select.user`）新增 `gender: true, churchType: true, churchOther: true, church: { select: { name: true } }`；這是對既有 select 的擴充，不需新建查詢函式，一次 DB round-trip 內解決。`EnrollmentRecord.user` 型別同步擴充這 4 個欄位。
- 教會三態解析（`churchType === 'church' ? church?.name : churchType === 'other' ? churchOther : null`）沿用 `user/[spiritId]/page.tsx` 既有的就地判斷寫法，在 `app/[locale]/(user)/course/[id]/page.tsx` 組裝 `students` prop 時算好 `churchLabel: string | null` 再傳給 client component（不把原始 `churchType`/`church`/`churchOther` 往下傳，比照既有模式）。此為該邏輯第三處重複實作（另兩處為 `user/[spiritId]/page.tsx`、`lib/data/friendship.ts`/`support-inquiry.ts`/`admin/members/[id]/page.tsx`）；維持現狀慣例，不在本次 CR 中抽出共用 helper（範圍外）。
- `ApprovedStudentItem` 型別新增 `gender: Gender`（從 `@/components/shared/gender-icon` import 型別）與 `churchLabel: string | null`。

## Risks / Trade-offs

- **[Risk] 一般學員可藉此快速瀏覽到同班同學的完整會員首頁（課程紀錄、學習進度等）。** 此風險在本次變更前就已存在（任何登入者本來就能透過網址直接到達該頁），本次變更僅降低了「發現」該頁面的門檔，不改變「能不能到達」的範圍。若未來需要收斂，應從 `/user/[spiritId]` 的存取守衛本身著手，而非從個別入口點各自補強。
- **[Risk] 一般學員現在也能在課程卡片上直接看到同班同學的性別、所屬教會。** 與上述風險同性質：該資料透過 `/user/[spiritId]`（本次 CR 新增的卡片連結即可一鍵到達）本來就對任何登入者可見，卡片顯示僅降低查看門檔，不新增可達範圍。

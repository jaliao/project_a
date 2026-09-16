## Context

`app/[locale]/(user)/course/[id]/copy-invite-link-button.tsx` 目前的行為：`navigator.share` 存在（多數手機瀏覽器）就叫用系統原生分享面板；不存在（多數桌機瀏覽器）就直接寫入剪貼簿並顯示一個 2 秒後消失的按鈕文字＋toast。桌機使用者回報「不知道如何操作」，根因是這個分支完全沒有任何說明或後續引導，容易被忽略。

調查過程中另外發現，`/dashboard` 路由目前是純轉址（`redirect(session.user.spiritId ? '/user/${spiritId}' : '/profile')`，見 `app/[locale]/(user)/dashboard/page.tsx` 註解「已搬移至 /admin 與 /user/[id]」），不再渲染 `DashboardActions`。全專案搜尋確認 `DashboardActions`／`CreateInviteDialog`／`CreateInviteForm`／`createInvite`／`getMyOrders` 皆為零引用的死碼，`InviteCopyButton`／`getMyInvites` 也僅被同樣無法觸達的 `/invites` 頁面使用。這條鏈路已與現實系統完全脫節，經與使用者確認一併清除。

## Goals / Non-Goals

- Goals：讓桌機使用者在點擊「複製邀請連結」後，清楚知道連結已產生且有多種管道可用於邀請對方；串接系統既有「傳訊息」機制作為第三種管道；清除已確認死碼的舊版開課邀請流程。
- Non-Goals：不改變手機端 `navigator.share` 的既有行為；不新增「搜尋/瀏覽會員清單」的通用選人 UI（沿用既有「輸入 Email 或啟動編號」查會員模式，與「新增學員」一致）；不處理 `invite-join`（`/invite/[token]`）與 `dashboard-course-preview`／`dashboard-function-units` 等同樣已知過時但與本次改動無直接關聯的規格（該路由本身在程式碼中已不存在，屬於更早、範圍更大的既有技術債，建議另開票處理，不在本次範圍內擴大處理）。

## Decisions

### 1. 電腦分支改開 Dialog，元件檔案與名稱維持不變
`copy-invite-link-button.tsx` 內的 `handleShare` 保留原生分享分支；`else` 分支不再直接呼叫 `navigator.clipboard.writeText` + toast，改為 `setDialogOpen(true)` 開啟新的分享 Dialog（沿用原本的複製邏輯，移到 Dialog 內的「複製連結」按鈕）。元件名稱 `CopyInviteLinkButton`／檔案路徑維持不變：這是課程詳情頁專用的單一用途元件（不在共用 `components/` 目錄下），單純改名不會帶來實質效益，反而增加不必要的 import 異動與 review 負擔，故不重新命名。

**判斷手機／桌機不可用 `navigator.share` 是否存在**：實作初版沿用原邏輯以 `navigator.share` 存在與否分流，上線後發現 **Windows 桌面版 Edge／Chrome 也實作了 Web Share API**（點擊後彈出 Windows 內建分享面板，而非本次新增的引導 Dialog），導致桌機使用者仍看到系統原生分享面板、完全繞過本次要解決的引導 Dialog——與原始需求「電腦版不知道如何操作」完全牴觸。修正為改用 User-Agent 判斷裝置類型（`/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)`），僅在判定為手機／平板**且**支援 `navigator.share` 時才叫用原生分享面板；其餘情況（含支援 Web Share API 的桌面瀏覽器）一律開啟分享 Dialog。

### 2. LINE／Email 分享採用純前端 deep link，不需後端
- LINE：`window.open('https://line.me/R/msg/text/?' + encodeURIComponent(text), '_blank')`（`text` 為「邀請文字＋連結」組成的字串）。
- Email：`window.location.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text)`。
- 兩者皆為業界慣用的純前端分享 deep link 手法，不需任何 Server Action，也不會留下任何伺服器端紀錄（與「使用系統內建訊息邀請」不同，後者需要伺服器端建立對話/訊息紀錄）。

### 3. 「使用系統內建訊息邀請」重用既有 `conversation` 模組，不新增訊息子系統
新增 `inviteMemberByMessage(inviteId, identifier)`（`app/actions/course-invite.ts`，緊鄰既有 `inviteBySpirtId`）：
1. 權限檢查沿用 `course-order.ts`／`course-invite.ts` 既有的 inline 寫法：`invite.createdById !== session.user.id && !canAccessAdmin(session.user.roles)` → 無權限。
2. 以既有 `findMemberByIdentifier(identifier)`（`lib/data/invite-students.ts`，與「新增學員」共用同一套 Email／啟動編號查會員邏輯）解析對方帳號。
3. 呼叫既有 `findConversationsWithUser(session.user.id, target.userId)`（`lib/data/conversation.ts`，已依 `lastMessageAt` 排序）：若有既有一對一對話，取第一筆呼叫既有 `sendConversationMessage(id, body)`；否則呼叫既有 `startConversation(target.userId, body)` 建立新對話。
4. `body` 內容為「邀請您加入「{課程名稱}」課程，請點擊連結查看詳情：{連結}」，與現有 `inviteBySpirtId` 站內通知的文案風格一致。

不新增任何新的資料模型或訊息子系統，完全組合既有三個已存在的 action／data 函式，改動範圍最小。

### 4. 死碼清除範圍的邊界：只清除「零引用」確認過的鏈路
清除範圍嚴格限定在搜尋確認為零引用的檔案／函式（`DashboardActions`、`CreateInviteDialog`、`CreateInviteForm`、`InviteCopyButton`、`/invites` 頁面、`createInvite`、`getMyInvites`、`getMyOrders`、`createInviteSchema`）。`lib/schemas/course-invite.ts` 中仍在使用的 `instructorFeedbackSchema` 保留，僅移除 `createInviteSchema` 區塊。`dashboard-course-preview`／`dashboard-function-units`／`invite-join` 三份規格雖然也已與現況（`/dashboard` 已改為純轉址）不符，但其對應的程式碼路徑與本次改動的死碼鏈路無直接關聯，屬於更早、範圍更大的既有技術債，不在本次一併處理，避免範圍失控。

### 5. `course-session-detail` 規格拆分為兩個獨立需求
原「講師專屬：複製邀請連結」需求內混雜了「複製連結按鈕」與「聯繫管理者按鈕維持講師專屬」兩件不相關的事（可能是先前編寫時的疏漏）。既然本次要大幅改寫複製連結相關的需求內容，順勢拆成「講師專屬：課程分享」與「講師專屬：聯繫管理者按鈕顯示條件」兩個獨立需求，讓規格結構更清楚；同時修正原文「複製 `/invite/{token}` 連結」的過時描述（實際格式為 `/course/{id}`，`/invite/{token}` 路由本身在程式碼中已不存在）。

## Risks / Trade-offs

- LINE 分享 deep link（`line.me/R/msg/text/`）依賴 LINE 官方公開的分享網址格式，若對方裝置未安裝 LINE App 或桌機瀏覽器未登入 LINE 網頁版，仍會導向 LINE 登入/下載頁面，這是所有第三方分享 deep link 的通用限制，非本次可解決範圍。
- 「使用系統內建訊息邀請」目前僅支援輸入單一 Email／啟動編號逐一邀請，不支援批次邀請多人；若未來有批次邀請需求，需另外設計批次輸入 UI，不在本次範圍。
- 死碼清除為破壞性變更（實體刪除檔案／函式），但因已確認零引用、無任何 UI 入口可觸達，對現有使用者無實際影響。

## Migration Plan

無資料庫 schema 變更。刪除的檔案／函式皆為確認零引用的死碼，刪除後執行 `npm run build`／`tsc --noEmit` 驗證無殘留引用即可，不需資料回填或使用者端遷移動作。

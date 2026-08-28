## Why

需求單 CR-SPEC-260828-008「管理者到會員首頁」（提出人：廖柏嘉 Justin，2026-08-28）：

> 管理者到會員首頁
>
> 從後台搜尋講師 / 會員，在查看詳情旁邊增加一個到會員首頁的按鈕

現況：

- 後台 `/admin/members`（會員／講師搜尋）與 `/admin/members/inactive`（未啟用會員）清單的「操作」欄只有「查看詳情」（連到後台詳情頁 `/admin/members/[id]`）與「重設」等按鈕；`/admin/members/[id]` 詳情頁頁首也只有「返回清單」「傳訊息」。
- 管理者若想以「會員視角」查看某人的個人首頁（`/user/[spiritId]`，即前台會員登入後看到的首頁：基本資料、學習進度、課程、授課等），目前沒有任何入口，只能自己把 `spiritId` 轉小寫手動拼網址。
- 會員首頁 `/user/[spiritId]` 位於 `(user)` route group（需登入），管理者本來就有權限瀏覽他人此頁（頁面已針對「非本人」情境隱藏本人專屬區塊、顯示「傳訊息」等），只是缺一顆按鈕。

決策：在後台會員相關清單／詳情既有操作區，新增一顆「會員首頁」按鈕，連往該會員的 `/user/<spiritId 小寫>`。

## What Changes

### 1. 共用按鈕元件 `MemberHomeLink`

- 新增 `components/admin/member-home-link.tsx`（client component，或 server 亦可——僅為連結）：
  - Props：`spiritId: string | null`、選填 `size`／`variant`（沿用 shadcn `Button` 慣例，預設 `variant="ghost"` `size="sm"`）。
  - `spiritId` 有值 → 渲染連結按鈕，`href={`/user/${spiritId.toLowerCase()}`}`，文字「會員首頁」，**於新分頁開啟**（`target="_blank"` `rel="noopener noreferrer"`），避免管理者離開目前搜尋結果／篩選狀態。
  - `spiritId` 為 null/空 → 渲染 `disabled` 狀態的按鈕（附 `title`「此會員尚無啟動編號」），不產生連結。
  - 連結用 `next/link`（比對既有「查看詳情」寫法；`/user/[spiritId]` 為 `[locale]` 下動態路由，locale 前綴由 middleware 處理，與既有 topbar `homeUrl` 同慣例）。

### 2. `/admin/members` 搜尋清單（主要）

- `app/[locale]/(admin)/admin/members/page.tsx`：在「操作」欄 `flex` 容器內、「查看詳情」與 `MemberResetButton` 之間（或「查看詳情」右側）插入 `<MemberHomeLink spiritId={member.spiritId} />`。

### 3. `/admin/members/inactive` 未啟用會員清單

- `app/[locale]/(admin)/admin/members/inactive/page.tsx`：在「操作」欄「查看詳情」旁插入 `<MemberHomeLink spiritId={m.spiritId} />`（未啟用會員多數 `spiritId` 為 null → 呈現 disabled，行為一致、不誤導）。

### 4. `/admin/members/[id]` 詳情頁頁首

- `app/[locale]/(admin)/admin/members/[id]/page.tsx`：頁首列（「返回清單」「姓名」「已暫停」badge、「傳訊息」）尾端加入 `<MemberHomeLink spiritId={member.spiritId} />`，讓管理者從詳情頁也能一鍵切到會員視角首頁。

### 5. i18n

- 依 CLAUDE.md #12「後台與其專屬字串本階段維持繁體」：按鈕文字「會員首頁」與 disabled 提示直接以繁體硬編碼於元件（比照同區既有「查看詳情」「重設」未 key 化）。**不新增** i18n key、不改 `messages/*.json`。

### 6. 文件與版本（apply 時）

- `doc/管理者操作手冊.md`：第四章（會員管理）補充「會員首頁」按鈕說明——位置（清單操作欄／詳情頁頁首）、行為（新分頁開啟會員個人首頁）、無啟動編號時停用；更新檔首版本標註與日期。
- `doc/老師手冊.md`／`doc/學員手冊.md`：純後台管理者功能，無異動。
- `README-AI.md` 對應章節（`ai-context/`）：路由結構／後台功能敘述如有列出 `/admin/members` 操作項，補一句「會員首頁」入口。
- `config/version.json`：patch +1、`updatedAt` 改為套用當日（CLAUDE.md #7）。

## Capabilities

### Modified Capabilities

- `admin-member-management`：新增「會員首頁快捷入口」需求——後台會員／講師清單與詳情頁提供連往 `/user/<spiritId 小寫>` 的按鈕，新分頁開啟，無 `spiritId` 時停用。

## Impact

- **Affected code**
  - 新增：`components/admin/member-home-link.tsx`
  - 修改：`app/[locale]/(admin)/admin/members/page.tsx`、`app/[locale]/(admin)/admin/members/inactive/page.tsx`、`app/[locale]/(admin)/admin/members/[id]/page.tsx`
- **資料層**：無變更。`searchMembers`（`lib/data/members.ts`）已 `select` `spiritId`；`getMemberDetail` 已 `select` `spiritId`；`listInactiveMembers`（`lib/data/account-recovery.ts`）已回傳 `spiritId`。皆無需改動。
- **Database**：無 schema 變更、無 migration。
- **權限／路由**：`/user/[spiritId]` 屬 `(user)` group（需登入），管理者已可存取；無新增免登入路由，`lib/auth/route-access.ts` 不動。
- **i18n**：不新增 key（後台字串維持繁體）。
- **Docs**（CLAUDE.md #9）：更新 `doc/管理者操作手冊.md` 並 bump 其版本標註；老師／學員手冊不動。
- **Version**（CLAUDE.md #7）：apply 時 `config/version.json` patch +1、`updatedAt` 當日。
- **Dependencies**：無新增套件。
- **非目標**：不改會員首頁 `/user/[spiritId]` 本身的內容或版面；不新增「以該會員身分登入／模擬」功能（本變更僅為唯讀瀏覽既有頁面）；不調整既有「查看詳情」連結行為。

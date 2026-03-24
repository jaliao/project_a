## Context

目前 `/dashboard` 是所有已登入使用者的唯一落點，同時承擔管理統計（會員數、近期活動）和個人功能（開課、學習）兩種職責。本次變更拆分這兩個角色：

- 學員個人頁面 `/user/{id}` — 展示個人基本資料與學習進度
- 管理後台 `/admin` — 原 dashboard 的統計與管理功能

現有資料模型已具備所需欄位：`User.realName`、`User.learningLevel`（int，0–4）、`InviteEnrollment`（已修課程關聯）。

## Goals / Non-Goals

**Goals:**
- 新增 `/user/[id]` 學員專屬頁面，含基本資料單元（姓名、身分標籤、已完成課程）
- 將原 `/dashboard` 管理功能搬至 `/admin`
- 修改登入後預設導向為 `/user/{currentUserId}`

**Non-Goals:**
- 不變更 `/user/{id}` 以外的其他頁面功能
- 不新增帳號管理或角色設定功能
- 不修改 learningLevel 的計算邏輯

## Decisions

### D1：路由結構

`/user/[id]` 放在 `app/(user)/user/[id]/page.tsx`，歸屬 (user) route group，自動套用側邊欄 layout，且 middleware 強制登入。

`/admin` 放在 `app/(user)/admin/page.tsx`，同樣套用 (user) layout。

**替代方案考量：** 獨立 `(admin)` route group 可有不同 layout，但目前管理後台視覺需求與一般頁面相同，不必拆分，保持簡單。

### D2：登入後預設導向

修改 `app/page.tsx`（根路徑 redirect）：呼叫 `auth()` 取得 session，若已登入則 redirect 至 `/user/${session.user.id}`。

`/dashboard` route 保留但改為 server-side redirect 至 `/user/{currentUserId}`，避免舊書籤失效。

**替代方案考量：** 在 middleware 攔截 `/dashboard` 做 redirect，但 middleware 無法直接取得 user ID（JWT token 有 id），需在 middleware 中讀取 token — 可行但增加複雜度。改由 page-level redirect 更直覺。

### D3：身分標籤顯示邏輯

learningLevel 對應關係：
- 0 → 無標籤（尚未完成任何課程）
- 1 → 啟動靈人 1 學員
- 2 → 啟動靈人 2 學員
- 3 → 啟動靈人 3 學員
- 4 → 啟動靈人 4 學員

使用 Badge 元件顯示，config 統一定義對應 label。

### D4：已完成課程資料來源

查詢目標使用者的 `InviteEnrollment`，join `CourseInvite.courseLevel`，顯示已加入的課程名稱清單。不另建新查詢函式，直接在 page server component 內查詢 prisma（單頁使用，無需放入 `lib/data/`）。

## Risks / Trade-offs

- **舊書籤 `/dashboard`**：保留 redirect，低風險
- **根路徑 `/` 呼叫 auth()**：增加一次 DB/JWT 讀取，但量級可接受
- **learningLevel = 0 無標籤**：UI 需處理空狀態，避免留白

## Migration Plan

1. 新增 `app/(user)/user/[id]/page.tsx`
2. 新增 `app/(user)/admin/page.tsx`（搬移 dashboard 內容）
3. 修改 `app/(user)/dashboard/page.tsx` → redirect 至 `/user/{id}`
4. 修改 `app/page.tsx` → redirect 至 `/user/{id}`
5. 更新側邊欄導覽連結

無 DB schema 變更，無 migration 需求。

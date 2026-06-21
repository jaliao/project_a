## Context

`/course/[id]` 位於 `app/(user)/course/[id]/page.tsx`，受兩道未登入守衛：
1. `middleware.ts`：非公開路徑且無 session cookie → `redirect('/login?callbackUrl=...)`。
2. `app/(user)/layout.tsx`（RSC）：`!userId → redirect('/login')`，並渲染含 session 的 `Topbar`。

兩者都使未登入者被靜默轉導。需求是改為在課程頁顯示登入提示卡片。課程詳情常以「複製邀請連結」分享給未登入者，因此這是常見入口。

## Goals / Non-Goals

**Goals:**
- 未登入存取 `/course/[id]` 顯示「無法檢視此課程，請先登入」卡片＋「前往登入」按鈕（連往 `/login?callbackUrl=/course/[id]`）。
- 僅課程詳情頁開放訪客提示；子路徑與其他 `(user)` 路由維持強制登入。
- 已登入行為與版面完全不變。

**Non-Goals:**
- 不對未登入者顯示任何課程內容（標題、學員、FAQ、操作）。
- 不改動 `/invite/[token]` 加入流程。
- 不開放其他 `(user)` 頁面給訪客。

## Decisions

### 決策 1：以「精確 `/course/數字`」判定訪客可達，子路徑不放行
middleware 與 layout 皆以正規式 `^/course/\d+$` 判定「課程詳情頁」。`/course/123/graduate` 不符 → 維持原強制登入轉導。避免用 `/course` 前綴造成所有子頁公開。
- 替代方案：把課程頁移出 `(user)` group 成為獨立公開路由 → 需搬檔、失去共用 layout、與既有 `/course/[id]/graduate`（仍在 `(user)`）路由衝突，否決。

### 決策 2：middleware 放行訪客課程路徑
在 `isPublic` 之外，新增判斷：`^/course/\d+$` 視為「可匿名進入」，不做 session cookie 轉導（其餘流程不變，仍傳遞 `x-pathname`）。
- 已登入者照常通過；未登入者不再被 middleware 攔下。

### 決策 3：layout 對訪客課程路徑改渲染精簡版面
`(user)/layout.tsx` 取得 `x-pathname`，當 `!userId && /^\/course\/\d+$/.test(pathname)` 時，**不轉導**，改渲染不含 `Topbar`（無 session 依賴）的精簡容器包住 `children`；其餘 `!userId` 情境維持 `redirect('/login')`。已登入者維持原本含 Topbar 版面與既有 onboarding／profile 守衛。
- 理由：Topbar 需要 session 資料；訪客提示卡片（依設計稿）為置中卡片，不需 Topbar。

### 決策 4：page 未登入時提前回傳提示卡片
`page.tsx` 取得 `auth()` 後，若無 session → 提前 `return` 登入提示卡片（含 `🔒 無法檢視此課程／請先登入後再檢視課程內容` 與「前往登入」按鈕，`href=/login?callbackUrl=/course/${id}`），不再往下查詢 FAQ／統計等，避免不必要查詢與 session 相依邏輯。
- 提示卡片以小型 client/server 元件呈現皆可；按鈕用 `next/link` 即可（無互動狀態）。

## Risks / Trade-offs

- [middleware 與 layout 兩處正規式需一致，否則訪客可進 middleware 卻被 layout 轉導] → 兩處皆用相同 `^/course/\d+$`，並於 tasks 標明同步。
- [course id 非數字（如 `/course/abc`）] → 正規式不符 → 維持原強制登入轉導；page 既有 `isNaN` 已 `notFound`，不影響。
- [未來若 `/course/[id]` 下新增更多公開子頁] → 需個別評估，預設子路徑仍受保護（安全預設）。

## Migration Plan

純前端／中介層邏輯調整，無 DB 變更。部署即生效；回滾＝還原 middleware／layout／page 三檔。

## Open Questions

無。

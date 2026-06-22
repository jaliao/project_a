## 1. 獨立暫停頁

- [x] 1.1 新增 `app/account-suspended/page.tsx`（Server Component；提示「此帳號已被暫停，無法登入，請聯繫管理員」＋「重新登入」按鈕，為一般連結 `<a href="/login">`／`<Link>` 整頁導覽；不讀 session、不做 client auth 呼叫）
- [x] 1.2 `middleware.ts`：`/account-suspended` 加入 `PUBLIC_PATHS`

## 2. 封鎖導向改為獨立頁

- [x] 2.1 `app/api/suspended-logout/route.ts`：清 session cookie 後，轉址目標由 `/login?error=Suspended` 改為 `/account-suspended`（仍以 `NEXTAUTH_URL` 組公開網址）
- [x] 2.2 `lib/auth.ts` signIn 守衛：被暫停回傳由 `'/login?error=Suspended'` 改為 `'/account-suspended'`

## 3. 登入頁回歸單純

- [x] 3.1 `app/(auth)/login/user-auth-form.tsx`：移除 `const suspended = searchParams.get('error') === 'Suspended'` 與暫停橫幅 JSX（及不再使用的相關 import）

## 4. 驗證

- [x] 4.1 `npm run build` 通過（tsc 無錯誤）
- [x] 4.2 HTTP 實測：`/account-suspended` 公開可達（200）；`/api/suspended-logout` 轉址至 `…/account-suspended` 並清 cookie；被暫停帳號登入 → 導向 `/account-suspended` 不發 session
- [x] 4.3 〔待實機 UI〕暫停某帳號 → 前台重整導向 `/account-suspended` →「重新登入」→ `/login`；後台恢復 → 直接登入成功（免手動重載）

## 5. 收尾

- [x] 5.1 依 CLAUDE.md 第 9 點檢視操作手冊：管理者手冊「暫停效果」描述由 `/login?error=Suspended` 更新為 `/account-suspended`
- [x] 5.2 apply 時將 `config/version.json` patch 版本號 +1

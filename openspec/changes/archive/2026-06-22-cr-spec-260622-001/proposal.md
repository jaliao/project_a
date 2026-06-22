## Why

被暫停帳號目前是導回 `/login?error=Suspended`（登入表單頁本身帶錯誤參數）。實測發現：使用者停在這個「被導向後一直沒重載」的登入分頁、且在暫停中嘗試過登入後，NextAuth client 端會累積壞掉的狀態；即使管理者已恢復該帳號，於同一頁再次登入仍會回報「Email 或密碼不正確」，必須手動整頁重載 `/login` 才能登入。伺服器、CSRF、cookie 重用經 HTTP 重現皆正常，問題純粹在「登入表單頁承載了暫停狀態」這個前端設計。

改用**獨立的「帳號已暫停」頁面**承載封鎖訊息，登入表單頁就永遠保持乾淨；以「重新登入」按鈕（一般連結、整頁載入）連到 `/login`，從根本上避免殘留的 client 狀態，恢復後即可直接登入。

## What Changes

- **新增**獨立頁 `/account-suspended`：顯示「此帳號已被暫停，無法登入，請聯繫管理員」與**「重新登入」按鈕**（一般 `<a href="/login">`，整頁載入）。
- `app/api/suspended-logout`：清除 session cookie 後改導向 `/account-suspended`（不再導向 `/login?error=Suspended`）。
- `lib/auth.ts` signIn 守衛：被暫停帳號的登入嘗試改導向 `/account-suspended`（取代 `/login?error=Suspended`）。
- `middleware.ts`：`/account-suspended` 加入 PUBLIC_PATHS（免登入可見）。
- `app/(auth)/login/user-auth-form.tsx`：**移除** `?error=Suspended` 橫幅與 `suspended` 相關邏輯，登入頁回歸單純。

## Capabilities

### New Capabilities
- `account-suspended-page`: 獨立的「帳號已暫停」頁面與乾淨重新登入流程——被暫停的既有 session 與登入嘗試一律導向此頁；頁面提供「重新登入」整頁連結至 `/login`，確保恢復後能直接登入、無需手動重載。

### Modified Capabilities
<!-- 暫停/恢復後端機制（封鎖、恢復、signIn 守衛）屬 cr-spec-260621-005，尚未封存同步至 openspec/specs/，故此處不列為主 specs 的 Modified。本變更僅調整「封鎖後導向何處」的前端 UX，不更動後端暫停判定規則。 -->

## Impact

- 新增：`app/account-suspended/page.tsx`（獨立頁）。
- 修改：`lib/auth.ts`（signIn 守衛導向）、`app/api/suspended-logout/route.ts`（導向目標）、`middleware.ts`（PUBLIC_PATHS）、`app/(auth)/login/user-auth-form.tsx`（移除 Suspended 橫幅）。
- 相依：與 cr-spec-260621-005 的暫停/恢復機制相接，僅替換封鎖後的前端落點，不影響後端規則與資料模型。

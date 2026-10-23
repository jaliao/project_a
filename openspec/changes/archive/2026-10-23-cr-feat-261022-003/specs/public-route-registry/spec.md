## ADDED Requirements

### Requirement: 代填學員完成註冊頁列為免登入頁

`lib/auth/route-access.ts` 的 `PUBLIC_PAGES` SHALL 包含 `/complete-registration`（`match: 'exact'`），並附原因（代填學員完成註冊，token 帶於 query）。`middleware.ts` 與各 group layout SHALL 透過既有的 `isPublicRoute` 判定放行，SHALL NOT 另列清單；頁面 SHALL 置於 `app/[locale]/(guest)/complete-registration/`。

#### Scenario: /complete-registration 免登入放行
- **WHEN** 未登入者請求 `/complete-registration?token=xxx`
- **THEN** `isPublicRoute('/complete-registration')` 回傳 true，middleware 不導向登入頁

#### Scenario: 帶 locale 前綴的完成註冊頁一致放行
- **WHEN** 請求 `/en/complete-registration?token=xxx`
- **THEN** 經 `stripLocale` 後判定為 `/complete-registration`，同樣免登入放行

#### Scenario: 已登入者開啟完成註冊頁不被導走
- **WHEN** 已登入使用者開啟 `/complete-registration?token=xxx`
- **THEN** `(guest)` layout 不將其導走，頁面正常依 token 驗證邏輯呈現（不因訪客頁身分而阻擋）

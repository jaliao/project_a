## ADDED Requirements

### Requirement: 課程介紹頁列為免登入頁

`lib/auth/route-access.ts` 的 `PUBLIC_PAGES` SHALL 包含 `/courses`（`match: 'exact'`），並附原因（SEO 公開課程介紹頁）。`middleware.ts` 與各 group layout SHALL 透過既有的 `isPublicRoute` 判定放行，SHALL NOT 另列清單。

#### Scenario: /courses 免登入放行
- **WHEN** 未登入者請求 `/courses`
- **THEN** `isPublicRoute('/courses')` 回傳 true，middleware 不導向登入頁

#### Scenario: 帶 locale 前綴的課程介紹頁一致放行
- **WHEN** 請求 `/en/courses`
- **THEN** 經 `stripLocale` 後判定為 `/courses`，同樣免登入放行

#### Scenario: 子路徑不因 exact 誤放行
- **WHEN** 請求 `/courses/anything`
- **THEN** 因 `/courses` 以 `exact` 宣告，`/courses/anything` 不被視為公開（回歸受保護預設）

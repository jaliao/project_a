## ADDED Requirements

### Requirement: 未登入訪客存取課程詳情頁顯示登入提示
未登入使用者存取 `/course/[id]`（數字 id 的課程詳情頁）時，系統 SHALL NOT 直接轉導 `/login`，而是在課程頁顯示登入提示卡片，且 SHALL NOT 顯示任何課程內容（標題、學員清單、FAQ、操作按鈕等）。

提示卡片 SHALL 包含說明文字「無法檢視此課程／請先登入後再檢視課程內容」與「前往登入」按鈕；按鈕 SHALL 導向 `/login?callbackUrl=/course/[id]`，使登入後返回原課程頁。

此放行僅限課程詳情頁本身；其子路徑（如 `/course/[id]/graduate`）與其他需登入頁面 SHALL 維持未登入時強制轉導 `/login`。

#### Scenario: 未登入存取課程詳情頁
- **WHEN** 未登入使用者存取 `/course/123`（id=123）
- **THEN** 頁面顯示登入提示卡片（「無法檢視此課程」與「前往登入」按鈕），不顯示課程內容，且不轉導 `/login`

#### Scenario: 點擊前往登入返回原課程
- **WHEN** 未登入使用者於提示卡片點擊「前往登入」
- **THEN** 導向 `/login?callbackUrl=/course/123`，登入成功後返回 `/course/123`

#### Scenario: 未登入存取課程子路徑仍強制登入
- **WHEN** 未登入使用者存取 `/course/123/graduate`
- **THEN** 系統維持原行為，轉導 `/login`

#### Scenario: 已登入使用者不受影響
- **WHEN** 已登入使用者存取 `/course/123`
- **THEN** 頁面照常顯示完整課程資訊與對應角色操作區塊（行為不變）

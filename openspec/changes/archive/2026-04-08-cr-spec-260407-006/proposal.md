## Why

會員在首次登入後，常未完成個人資料（真實姓名、電話等），導致後續課程報名或書本寄送無法處理。目前僅以靜態警告訊息提醒，強制力不足。需設計一個可在環境變數控制的強制轉導機制，讓正式環境能強制導向資料頁，開發/測試環境可保留原有提醒行為。

## What Changes

- 新增環境變數 `REQUIRE_PROFILE_COMPLETION`（預設 `true`）
- 當變數為 `true` 時，middleware 或 layout 偵測到會員缺少必填欄位（`realName`、`phone`）時，強制導向 `/user/[spiritId]/profile`
- 當變數為 `false` 時，保留現有在 profile 頁顯示橘色警告訊息的行為
- 導向時附加 `?incomplete=1` query param，profile 頁顯示對應提示文字

## Capabilities

### New Capabilities

- `profile-completion-guard`: 依環境變數控制未填資料時的強制轉導邏輯

### Modified Capabilities

- `profile-completion-banner`: 原有警告橫幅的顯示條件與文案調整（環境變數關閉時才顯示）

## Impact

- `app/middleware.ts`：新增 profile 完整性檢查邏輯
- `app/(user)/layout.tsx` 或 `profile/page.tsx`：讀取 `?incomplete=1` 顯示提示
- `.env.example`：新增 `REQUIRE_PROFILE_COMPLETION` 說明
- 影響所有已登入且資料未填的 Email 帳號會員

## Why

申請教材選擇超商取貨時，ECPay 門市選擇器選完門市後視窗不關閉，網址停在 `/login?callbackUrl=%2Fapi%2Fecpay%2Fstore-callback`。原因：ECPay 選完門市後以**跨站 POST** 回傳門市資料至 `/api/ecpay/store-callback`，但該路徑未列入 middleware 公開白名單；跨站 POST 不帶 NextAuth session cookie（SameSite=Lax），middleware 因此將其轉導 `/login`，導致 callback 頁的 `postMessage` 與 `window.close()` 從未執行，視窗卡在登入頁。

## What Changes

- middleware 將 `/api/ecpay/store-callback` 列為公開路徑，使 ECPay 跨站 POST 回傳能直達 callback route，正確回傳門市資料給父視窗並自動關閉視窗。
- 不改動門市選擇器流程與 callback 內容（既有 postMessage／window.close 邏輯不變）。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `ecpay-store-selector`: 明定 `/api/ecpay/store-callback` 為免登入公開路徑（ECPay 跨站 POST 回傳不帶 session cookie），確保 callback 不被 middleware 轉導 `/login`。

## Impact

- `middleware.ts`：`PUBLIC_PATHS` 新增 `/api/ecpay/store-callback`（或等效判斷）。
- 不影響 `/api/ecpay/store-map`（以同源 GET 開啟，cookie 正常帶入）。
- `config/version.json` patch +1；屬問題修復，依 CLAUDE.md 第 9 點檢查手冊（預期無流程文字異動）。

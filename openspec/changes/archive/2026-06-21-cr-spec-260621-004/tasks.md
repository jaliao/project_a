## 1. Middleware 修正

- [x] 1.1 `middleware.ts`：`PUBLIC_PATHS` 新增 `/api/ecpay/store-callback`，使 ECPay 跨站 POST 回傳不被轉導 `/login`

## 2. 驗證

- [x] 2.1 `npm run build` 通過（tsc 無錯誤）
- [x] 2.2 未帶 session cookie 對 `/api/ecpay/store-callback` POST：回應為 callback HTML（含 postMessage/window.close），非 307 轉導 `/login`
- [x] 2.3 申請教材選超商取貨 → 開門市選擇器 → 選門市後視窗自動關閉、門市資料回填表單
- [x] 2.4 確認 `/api/ecpay/store-map` 與其他需登入路徑行為不變（未登入仍轉導 `/login`）

## 3. 收尾

- [x] 3.1 依 CLAUDE.md 第 9 點檢查 `doc/` 手冊（屬問題修復，預期無使用者流程文字異動，確認後若無變動則略過）
- [x] 3.2 apply 時將 `config/version.json` patch 版本號 +1

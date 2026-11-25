## 1. 實作 /api/version route

- [x] 1.1 新增 `app/api/version/route.ts`，`export async function GET()` 讀取 `config/version.json` 並以 `NextResponse.json({ version, updatedAt })` 回傳
- [x] 1.2 於 `lib/auth/route-access.ts` 的 `PUBLIC_APIS` 新增一筆 `{ match: 'exact', path: '/api/version', reason: '版本查詢端點：供跨環境版本比對工具 curl 查詢，無敏感資料' }`

## 2. 本機驗證

- [x] 2.1 `npm run build` 確認可正常編譯
- [x] 2.2 `npm run dev` 啟動後 `curl http://localhost:3000/api/version` 確認回傳 200 與正確 JSON（含目前 `config/version.json` 的 version/updatedAt）

## 3. 部署正式環境

- [x] 3.1 依既有正式環境部署程序將本次變更部署到 GCP 正式站（`35.236.153.251`，對外網域 `https://activate.kuaglobal.org`）：`make push` → `make tunnel-deploy-prd`
- [x] 3.2 `curl https://activate.kuaglobal.org/api/version` 驗證回傳 200 與正確 JSON

## 4. 補上跨環境版本比對工具設定

- [x] 4.1 編輯 `~/.claude/skills/bc-version/projects.json`，於 `"project_a"` 補上 `"prdUrl": "https://activate.kuaglobal.org"`
- [x] 4.2 同步補上 `"testUrl": "https://project-a-stg.blockcode.com.tw"`（test/staging 站）
- [x] 4.3 執行 `/bc-version project_a` 確認 test／prd 版本號皆可正確顯示（test 因本次未部署 stg，顯示連線失敗；prd 正確顯示 0.1.246）

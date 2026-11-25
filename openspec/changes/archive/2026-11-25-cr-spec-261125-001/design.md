## Context

`project_a` 目前沒有任何對外公開的健康檢查/版本查詢端點。全域 `/bc-version` skill 已支援讀取任一專案的 `{prdUrl}/api/version`、`{testUrl}/api/version`，只要回傳 `{ version, updatedAt }` 的 JSON 即可，bc-erp 已採用同一慣例（`projects.json` 設有 `prdUrl`）。本次只是把 project_a 補齊這個既有慣例，不涉及新架構。

## Goals / Non-Goals

**Goals:**
- 新增最小化的 `/api/version` Route Handler，讀 `config/version.json` 並原樣回傳 `version`/`updatedAt`。
- 將此端點登記為免登入 API，供外部 `curl`／`/bc-version` 查詢工具存取。
- 補上 `~/.claude/skills/bc-version/projects.json` 的 `prdUrl`/`testUrl`，讓 `/bc-version project_a` 可查到三環境版本。

**Non-Goals:**
- 不做身分驗證、不做 rate limit（純讀取靜態設定檔，無敏感資料，風險低）。
- 不擴充回傳欄位（如 git commit hash、build time），維持與 bc-erp 一致的最小 schema。
- 不在此次變更內處理 CR-SPEC-261125-001 本身的部署（部署流程見 tasks.md 的最後步驟，走既有 `make push` + `make tunnel-deploy-test`／GCP 正式環境既有部署程序，不新增部署機制）。

## Decisions

- **Route 實作方式**：用 Next.js App Router 的 `app/api/version/route.ts`，`export async function GET()` 直接 `import` `config/version.json` 並回傳 `NextResponse.json({ version, updatedAt })`。理由：專案既有慣例是 App Router + Route Handler（見 `app/api/` 下其他 API），沒有理由另立機制；直接 `import` JSON 比跑時讀檔案系統更簡單且在 standalone build 下行為一致。
- **免登入登記方式**：在 `lib/auth/route-access.ts` 的 `PUBLIC_APIS` 加一筆 `{ match: 'exact', path: '/api/version', reason: '版本查詢端點：供跨環境版本比對工具 curl 查詢，無敏感資料' }`。理由：CLAUDE.md 規則要求所有免登入 API 必須在此單一事實來源註冊，不得另立清單。
- **projects.json 網域**：`prdUrl` 用使用者確認的 `https://activate.kuaglobal.org`（不含路徑），`testUrl` 用既有 CLAUDE.md 記載的 `https://project-a-stg.blockcode.com.tw`。理由：與 `/bc-version` skill 現有慣例（`prdUrl`/`testUrl` 不含 `/api/version` 後綴，由 skill 自行拼接）一致。

## Risks / Trade-offs

- **[風險] 對外洩漏目前部署版本號** → 風險低：僅洩漏語意化版本號與日期，無法推導出漏洞資訊；比照 bc-erp 現有作法可接受。
- **[風險] stg 站網域尚未實際確認是否仍服務中（CLAUDE.md 標示為 test/staging，可能隨時間變動）** → 本次僅依現有文件設定 `testUrl`；若之後站點網域變動，由 `projects.json` 單獨更新，不影響程式碼。

## Migration Plan

1. 本機新增 route + 修改 `route-access.ts`，`npm run build` 確認可編譯。
2. 依既有流程部署到 test/staging（`make push` → `make tunnel-deploy-test`），`curl https://project-a-stg.blockcode.com.tw/api/version` 驗證。
3. 比照既有正式環境部署方式部署到 GCP 正式站，`curl https://activate.kuaglobal.org/api/version` 驗證。
4. 更新 `~/.claude/skills/bc-version/projects.json` 補上 `prdUrl`/`testUrl`（此檔不受專案 git 版控，直接編輯即可，無需部署）。
5. 無需 rollback 機制：此端點為單純唯讀查詢，若需下線直接移除 route 與 `route-access.ts` 的登記即可。

## Open Questions

（無）

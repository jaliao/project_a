# Design: cr-spec-260720-005 Makefile 正式環境命名統一為 prd

## Context

`Makefile` 第 22–23 行定義 `PRISMA_VPS3_DB`／`PRISMA_GCP_DB`；「Prisma 透過 tunnel deploy remote GCP」區塊（約 493–518 行）含 `tunnel-gcp`、`tunnel-deploy-gcp`、`prisma-gcp-status/deploy/seed`，呼叫 `~/devops-toolkit/remote-admin/tunnel/pg-tunnel-gcp-activate.sh` 與 `project-a-tunnel-deploy-gcp.sh`（不在本 repo 版控範圍，檔名不動）。`.env`／`.env.example` 有 `DATABASE_URL_GCP`（組成自 `GCP_POSTGRES_USER`/`GCP_POSTGRES_PASSWORD`/`GCP_POSTGRES_DB`）。kua-event 的對應命名為 `PRISMA_PRD_DB`、`tunnel-prd`、`tunnel-deploy-prd`、`prisma-prd-status/deploy/seed/studio`。

## Goals / Non-Goals

**Goals:**
- Makefile 內「gcp」相關目標與變數更名為「prd」，比照 kua-event。
- 新增 `prisma-prd-studio`（kua-event 有、project_a 缺）。
- `.env`／`.env.example` 的 `DATABASE_URL_GCP` 更名 `DATABASE_URL_PRD`。

**Non-Goals:**
- 不改 `~/devops-toolkit` 下的實際腳本檔名（超出本 repo 範圍，使用者已確認本次不動）。
- 不改 `vps3` 系列命名（獨立部署路徑）。
- 不改底層雲端服務本身（GCP 執行個體、DB 連線資訊不變，僅重新命名 Make 目標與變數）。

## Decisions

### D1：Makefile 目標與變數更名對照

| 舊 | 新 |
|---|---|
| `PRISMA_GCP_DB` | `PRISMA_PRD_DB` |
| `tunnel-gcp` | `tunnel-prd` |
| `tunnel-deploy-gcp` | `tunnel-deploy-prd` |
| `prisma-gcp-status` | `prisma-prd-status` |
| `prisma-gcp-deploy` | `prisma-prd-deploy` |
| `prisma-gcp-seed` | `prisma-prd-seed` |
| （無） | `prisma-prd-studio`（新增） |

區塊註解「Prisma 透過 tunnel deploy remote GCP」改為比照 kua-event 風格：「正式環境 project_a-prd（GCP instance）／部署流程：make push → make tunnel-deploy-prd／Prisma 流程：make tunnel-prd → prisma-prd-status → prisma-prd-deploy → prisma-prd-seed」。`.PHONY` 宣告同步更新。

Makefile 目標內部呼叫的腳本路徑（`pg-tunnel-gcp-activate.sh`、`project-a-tunnel-deploy-gcp.sh`）**維持原檔名不動**——僅 Make 目標名稱與其說明文字改為 prd，腳本本身描述的是實際雲端供應商（GCP），檔名不受此次「環境角色命名」調整影響。

### D2：`.env`／`.env.example` 變數更名

`DATABASE_URL_GCP` → `DATABASE_URL_PRD`（值不變，僅變數名稱）。`GCP_POSTGRES_USER`/`GCP_POSTGRES_PASSWORD`/`GCP_POSTGRES_DB` 三個組成變數**維持原名不變**——這三個描述的是「GCP 上的 Postgres 帳密」，語意仍指向 GCP 基礎設施本身（非環境角色），且 kua-event 亦未對其 `PRISMA_PRD_DB` 的底層組成變數命名做強制要求；僅有 Makefile／`Prisma` 直接消費的 `DATABASE_URL_*` 命名需與環境角色（dev/vps3/prd）對齊。

替代方案：三個 `GCP_POSTGRES_*` 一併改名為 `PRD_POSTGRES_*`——考量這些變數名稱與雲端供應商命名慣例緊密（其他專案的類似變數多保留供應商前綴），且非 Makefile 目標本身，改名效益低、變更面更大，故不採用。

### D3：CLAUDE.md 同步

CLAUDE.md 目前僅列出 `vps3` 相關指令（`make tunnel-vps3` 等），未引用任何 `prisma-gcp-*` 目標，故無需修改；僅需巡檢確認無遺漏引用。

## Risks / Trade-offs

- [Makefile 目標更名後，任何已寫死 `make prisma-gcp-*` 的外部腳本／習慣會失效] → 純本機開發工具，使用者（僅自己）需知悉新目標名稱；提交後第一時間口頭確認。
- [`.env` 變數更名但 `GCP_POSTGRES_*` 保留造成命名不完全一致] → 已於 D2 說明理由，屬有意的部分保留。

## Migration Plan

無 migration（純 Makefile／環境變數命名調整，非程式碼或資料庫變更）。

## Open Questions

（無）

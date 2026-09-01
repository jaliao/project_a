# README-AI.md

> 自動產生，版本 0.1.193（2026-09-01）
> 供 AI 輔助開發使用，反映當前系統狀態。
>
> 本檔為索引；完整內容已依 `.ai-rules.md` 定義的七大章節拆分至 [`ai-context/`](ai-context/)，每章一檔，避免單一檔案過大。

---

## 章節索引

| # | 章節 | 檔案 | 內容概要 |
|---|------|------|----------|
| 1 | 專案核心目標 | [ai-context/01-goals.md](ai-context/01-goals.md) | 產品定位與核心目標 |
| 2 | 技術棧 | [ai-context/02-tech-stack.md](ai-context/02-tech-stack.md) | 前端/認證/ORM/多語系/資料庫等技術選型 |
| 3 | 系統架構 | [ai-context/03-architecture.md](ai-context/03-architecture.md) | `app/`／`components/`／`lib/`／`prisma/`／`config/` 目錄結構與職責 |
| 4 | 核心資料模型 | [ai-context/04-data-model.md](ai-context/04-data-model.md) | 各 Prisma model 欄位與關聯說明 |
| 5 | 關鍵業務邏輯 | [ai-context/05-business-logic.md](ai-context/05-business-logic.md) | 認證流程、Spirit ID、課程目錄、身分標籤、開課精靈等核心流程 |
| 6 | 開發規範 | [ai-context/06-dev-standards.md](ai-context/06-dev-standards.md) | 語言、元件、資料查詢、表單、通知、信件、版本號等慣例 |
| 7 | 當前挑戰與任務 | [ai-context/07-current-tasks.md](ai-context/07-current-tasks.md) | 歷史 CR 變更記錄（累積式，檔案本身仍會持續變長屬正常現象） |

---

## 維護說明

- 每次 `/opsx:apply` 套用變更後，須依照 `.ai-rules.md` 的規範更新對應章節檔案（不再是單一大檔，只需編輯有異動的章節檔）。
- 新增歷史 CR 記錄一律附加於 `ai-context/07-current-tasks.md`「已完成」清單最前面。
- 本檔（索引本身）僅在章節新增/移除、或版本號變動時才需要修改。

# 2. 技術棧

> 屬於 [README-AI.md](../README-AI.md) 拆分章節，回索引請見該檔。

| 層級 | 技術 |
|------|------|
| 前端框架 | Next.js 16.1.1 (App Router) + React 19 + TypeScript 5 |
| 樣式 | Tailwind CSS 4 + shadcn/ui (Radix UI) + Tabler Icons |
| 認證 | NextAuth 5.0 (beta) — Google OAuth + Credentials |
| ORM | Prisma 7.2.0 多檔案 schema |
| 多語系 | next-intl 4（zh-TW 預設 / en / zh-CN；path-prefix as-needed；簡體由 OpenCC 自動產生） |
| 資料庫 | PostgreSQL（Docker 開發，VPS3 生產） |
| 運行環境 | Docker（standalone build） |
| 工具 | date-fns 4、bcryptjs、Zod、React Hook Form、Sonner |

# README-AI.md

> 自動產生，版本 0.1.2（2026-03-23）
> 供 AI 輔助開發使用，反映當前系統狀態。

---

## 1. 專案核心目標

**啟動靈人系統**（project_a）是一套面向課程教學機構的會員管理 ERP 平台。
核心目標：
- 集中管理會員（學員）資料與 Spirit ID 身分識別
- 提供課程管理入口（規劃中）
- 支援 Google OAuth + Email/密碼雙模式登入，並以 Email 白名單控制存取

---

## 2. 技術棧

| 層級 | 技術 |
|------|------|
| 前端框架 | Next.js 16.1.1 (App Router) + React 19 + TypeScript 5 |
| 樣式 | Tailwind CSS 4 + shadcn/ui (Radix UI) + Tabler Icons |
| 認證 | NextAuth 5.0 (beta) — Google OAuth + Credentials |
| ORM | Prisma 7.2.0 多檔案 schema |
| 資料庫 | PostgreSQL（Docker 開發，VPS3 生產） |
| 運行環境 | Docker（standalone build） |
| 工具 | date-fns 4、bcryptjs、Zod、React Hook Form、Sonner |

---

## 3. 系統架構

```
app/
├── (auth)/          # 公開路由：login, register, forgot/reset-password
├── (user)/          # 已登入路由群組（共用 Topbar layout）
│   ├── layout.tsx   # Topbar 包裝層
│   ├── dashboard/   # 首頁：統計卡片 + 近期活動
│   └── profile/     # 個人資料維護
├── change-password/ # 臨時密碼強制變更
├── api/auth/        # NextAuth handlers
├── middleware.ts    # 未登入攔截 + 臨時密碼強制導向
└── layout.tsx       # Root layout（Toaster）

components/
├── ui/              # shadcn/ui 基礎元件
├── layout/
│   └── topbar.tsx   # 頂部工具列（新增課程/個人資料/訊息）
└── dashboard/
    ├── stats-card.tsx      # 統計卡片
    └── recent-members.tsx  # 近期加入會員列表

lib/
├── auth.ts          # NextAuth 設定（JWT + Google + Credentials）
├── prisma.ts        # Prisma client singleton
├── spirit-id.ts     # Spirit ID 產生器
├── schemas/         # Zod 驗證 schema
└── utils.ts         # cn() 等工具函數

prisma/
├── schema/
│   ├── base.prisma     # generator + datasource
│   ├── user.prisma     # User, Account, Session, WhitelistedEmail
│   └── project.prisma  # (保留，目前無業務模型)
└── seed.ts

config/
├── version.json     # 版本號（SemVer 唯一來源）
└── project-status.ts, project-type.ts
```

---

## 4. 核心資料模型

### User
```
id            UUID（主鍵）
email         String（唯一，登入帳號）
name          String?
role          UserRole (user | admin | superadmin)
spiritId      String?（唯一，格式 PA+YY+XXXX）
passwordHash  String?（Google-only 為 null）
isTempPassword Boolean（臨時密碼強制變更旗標）
commEmail     String?（通訊 Email）
realName      String?
createdAt / updatedAt / lastLoginAt
```

### WhitelistedEmail
```
email     String（唯一）
isActive  Boolean（控制登入許可）
```

---

## 5. 關鍵業務邏輯

### 認證流程（多層）
1. **Middleware** — 攔截未登入請求，導向 `/login?callbackUrl=<path>`
2. **Email 白名單** — Google OAuth callback 驗證 `WhitelistedEmail.isActive`
3. **臨時密碼攔截** — `isTempPassword=true` 強制導向 `/change-password`
4. **JWT** — 儲存 `id`, `role`, `spiritId`, `isTempPassword`（30 天）
5. **登入後預設導向** — `/dashboard`

### Spirit ID 核發
- 格式：`PA` + 年份後兩碼 + 4 位流水號（例 `PA261001`）
- 首次 Google 登入自動觸發核發

---

## 6. 開發規範

- **語言**：繁體中文（註解、文件）
- **元件預設**：Server Component，僅互動部分加 `"use client"`
- **資料查詢**：`lib/data/`（多處複用）或 Server Action 直接 Prisma（單一用途）
- **表單**：Zod schema → React Hook Form → Server Action → ActionResponse → Sonner toast
- **版本**：`config/version.json` 為唯一來源（patch +1 per `/opsx:apply`）
- **Prisma import**：`@prisma/client`（tsconfig paths 已設定）

---

## 7. 當前挑戰與任務

### 已完成
- `cr-spec-260323-001` — 基礎架構建立
- `cr-spec-260323-004` — 會員系統模組（認證、白名單、個人資料）
- `cr-spec-260323-005` — 登入後首頁（Dashboard）+ Topbar

### 進行中 / 待規劃
- 課程管理模組（Topbar「新增課程」預留入口）
- 訊息通知系統（Topbar「訊息」預留入口）
- 會員管理後台（CRUD、搜尋、分頁）

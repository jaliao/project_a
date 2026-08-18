# CLAUDE.md

Before reading any files, always check the file structure. Do not read files in node_modules or .next. When modifying code, only provide the necessary snippets and follow the standards in README-AI.md.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

project_a（啟動靈人系統）is a Next.js 16 enterprise resource planning system with time tracking, project management, and user authentication. The codebase uses Traditional Chinese (繁體中文) for comments and documentation.

**Tech Stack:**
- Next.js 16.1.1 (App Router) + React 19 + TypeScript 5
- PostgreSQL + Prisma ORM 7.2.0 (multi-file schema setup)
- NextAuth 5.0 (beta) with Google OAuth + email whitelist
- Tailwind CSS 4 + Radix UI components
- Docker for development and production

## Token Saving Rules (CRITICAL)
- **Do not read binary files** or folders: `node_modules`, `.next`, `public`, `prisma/generated`.
- **Prefer Data Layer**: When asked about data fetching, read `lib/data/` first.
- **Partial Updates Only**: Never output the full file content unless explicitly requested. Use comments like `// ... existing code ...` to omit unchanged parts.
- **Spec-First**: If a task relates to `openspec/specs/`, read the spec file before scanning the `app/` directory.

## Common Development Commands

### Daily Development
```bash
# Start PostgreSQL database (runs in Docker)
make dev

# Start Next.js development server (separate terminal)
npm run dev

# Open Prisma Studio to view database
make prisma-studio
```

### Database Schema Changes
```bash
# Full schema update workflow (RECOMMENDED)
# This will: format → validate → create migration → generate client → restart container
make schema-update

# Specify migration name (optional, defaults to auto_YYYYMMDD_HHMMSS)
make schema-update name=add_project_sticky_notes

# Quick update without creating migration (development only)
make schema-quick

# Check migration status
make prisma-status

# Seed test data (local development)
make prisma-seed
```

### Full Environment Reset
```bash
# Complete reset (deletes all data)
make clean && make dev && make schema-update && make prisma-seed
```

### Code Quality
```bash
npm run lint        # Check code style
npm run build      # Test production build
```

### Database Management
```bash
make db-shell      # Enter PostgreSQL CLI
make db-backup     # Backup database
make prisma-studio # Visual database browser
```

### Production Deployment (VPS3)
```bash
# Deploy migrations to remote database via SSH tunnel
make tunnel-vps3              # Open tunnel first (separate terminal)
make prisma-vps3-status       # Check migration status
make prisma-vps3-deploy       # Deploy migrations
make prisma-vps3-seed         # Seed data (optional)
```

## Architecture Overview

### Directory Structure

- **`app/`** - Next.js App Router
  - **`(user)/`** - Route group for authenticated users (sidebar layout)
    - `dashboard/`, `projects/`, `timesheet/` - Main feature pages
  - **`actions/`** - Server Actions (project.ts, time-entry.ts)
  - **`api/auth/`** - NextAuth handlers
  - `middleware.ts` - Authentication middleware

- **`components/`** - React components
  - `ui/` - shadcn/ui primitives (Radix UI based)
  - `layout/` - Sidebar and navigation
  - `projects/`, `time-entry/`, `project-table/` - Feature components

- **`lib/`** - Core utilities
  - `auth.ts` - NextAuth configuration with email whitelist
  - `prisma.ts` - Prisma client singleton with connection pooling
  - `data/` - Data access layer (encapsulates Prisma queries)
  - `schemas/` - Zod validation schemas (shared client/server)

- **`prisma/`** - Database layer
  - **`schema/`** - Multi-file Prisma schema (base, user, project)
  - `migrations/` - Migration history
  - `generated/` - Generated Prisma client (custom output path)
  - `seed.ts` - Database seeding script

- **`config/`** - Configuration files
  - `project-status.ts`, `project-type.ts` - Config-driven enums with metadata

- **`hooks/`** - Custom React hooks
  - `use-timer.ts` - Timer with localStorage + cross-tab sync
  - `use-mobile.ts` - Mobile detection

- **`types/`** - TypeScript type definitions
  - `next-auth.d.ts` - NextAuth session type extensions

### Authentication Architecture (Multi-Layer)

1. **Middleware** (`app/middleware.ts`): Runs on every request, checks public vs protected paths
2. **Email Whitelist**: Google OAuth callback validates email against `WhitelistedEmail` table
3. **JWT Session**: Stores user `id`, `role`, `email` (30-day max age)
4. **Layout Protection**: `(user)/layout.tsx` validates session server-side

**Email Whitelist Flow:**
- Only emails in `WhitelistedEmail` table with `isActive=true` can authenticate
- Non-whitelisted users redirected to `/login?error=NotWhitelisted`
- JWT callback syncs user data from database (role, lastLoginAt)

### Prisma Multi-File Schema (Unique Setup)

**Location:** `prisma/schema/` (3 files)
- **`base.prisma`** - Generator and datasource configuration only
- **`user.prisma`** - Authentication models (User, Account, WhitelistedEmail)
- **`project.prisma`** - Business models (Project, TimeEntry, ProjectCounter)

**Custom Output Path:** `@prisma/client` aliased to `./prisma/generated/prisma_client` (see tsconfig.json paths)

**Why Multi-File?**
- Separation of concerns (auth vs business logic)
- Easier navigation in large schemas
- Team collaboration (reduces merge conflicts)

### Server Actions Pattern

**Location:** `app/actions/` (project.ts, time-entry.ts)

**Standard Response Type:**
```typescript
type ActionResponse = {
  success: boolean
  message?: string      // For toast notifications
  data?: any
  errors?: Record<string, string[]>  // Zod field errors
}
```

**Pattern:**
1. Validate session (`auth()`)
2. Validate input (Zod schema)
3. Execute database operations (use transactions for complex updates)
4. `revalidatePath()` to refresh affected pages
5. Return consistent ActionResponse

**Transaction Example:** Time entry updates affect project `hoursUsed` - all updates happen atomically in `prisma.$transaction()`.

### Config-Driven Enums

**Location:** `config/project-status.ts`, `config/project-type.ts`

**Pattern:**
```typescript
export const PROJECT_STATUSES = {
  quoting: { label: "報價中", color: "blue", ... },
  confirmed: { label: "已確認", color: "green", ... },
  // ...
} as const

export const PROJECT_STATUS_VALUES = Object.keys(PROJECT_STATUSES)
export type ProjectStatus = keyof typeof PROJECT_STATUSES
```

**Benefits:**
- Single source of truth for labels, colors, descriptions
- Type-safe helpers: `getStatusConfig()`, `getStatusOptions()`
- Zod schemas derive from config: `z.enum(PROJECT_STATUS_VALUES)`

### Project Code Generation

**Pattern:** Auto-increment counter per type/year
- Format: `{type}{year}{counter}` → `P2601`, `P2602`, `M2601`, `H2601`
- Atomic: Uses `projectCounter.upsert()` with transaction
- Reset: Counter increments within type+year combination

### Timer Hook (Cross-Tab Sync)

**Location:** `hooks/use-timer.ts`

**Features:**
- localStorage persistence (survives page refresh)
- Custom events for same-page component sync
- Storage events for cross-tab sync
- Real-time elapsed time calculation (interval-based)

## Important Patterns to Follow

### 1. Server vs Client Components
- **Default to Server Components** for data fetching
- Use `"use client"` only for interactivity (forms, dialogs, state)
- Pattern: Server Component fetches → passes data → Client Component renders interactive UI

### 2. Form Handling
- Define Zod schema in `lib/schemas/`
- Use React Hook Form with `zodResolver`
- Call Server Action in `onSubmit`
- Show toast on success/error using ActionResponse

### 3. Database Access
- Use data access layer (`lib/data/`) for queries used across multiple components
- Call Prisma directly in Server Actions for mutations
- Always validate session in Server Actions
- Use transactions for operations affecting multiple tables

### 4. Code Comments
- Use Traditional Chinese (繁體中文) for all comments
- Include standard header format:
  ```typescript
  /*
   * ----------------------------------------------
   * Component/File Name
   * 2026-XX-XX (Updated: 2026-XX-XX)
   * path/to/file.ts
   * ----------------------------------------------
   */
  ```

### 5. Route Groups
- `(user)/` prefix for authenticated routes (doesn't affect URL)
- Shared layout in `(user)/layout.tsx` adds sidebar automatically
- Session check in layout prevents unauthenticated access

### 6. Styling
- Tailwind CSS with shadcn/ui pattern
- Use `cn()` utility for className merging
- Radix UI for complex components (Dialog, Dropdown, Select)
- Tabler Icons for iconography

### 7. Version Update
- 每次 `/opsx:apply` 套用變更時，須自動將 `config/version.json` 的 patch 版本號 +1（例如 `0.1.0` → `0.1.1`），並**同步更新 `updatedAt` 為當日日期**（YYYY-MM-DD）
- 版本號格式為 SemVer（`major.minor.patch`）
- `config/version.json` 是版本號的唯一來源，登入後頁面 Footer 顯示對應版本與系統更新日期

### 8. README-AI.md Update
- `README-AI.md`（根目錄）為索引檔，七大章節內容拆分至 `ai-context/01-goals.md` ~ `07-current-tasks.md`（每章一檔，避免單一檔案過大；2026-08-14 拆分。⚠️ 是根目錄下的 `ai-context/`，不是 `docs/ai-context/`——`docs/`〔複數〕已被 `.git/info/exclude` 排除於版控之外，僅 `doc/`〔單數，中文手冊〕與 `ai-context/` 會進版控）
- 每次 `/opsx:apply` 套用變更後，須依照 `.ai-rules.md` 的規範更新**有異動的章節檔**（不需重寫整份索引）：反映最新的版本號、資料模型、路由結構、業務邏輯與當前任務狀態
- 新增歷史 CR 記錄一律附加於 `ai-context/07-current-tasks.md`「已完成」清單最前面
- 七大章節結構（`.ai-rules.md` 定義）：專案核心目標、技術棧、系統架構、核心資料模型、關鍵業務邏輯、開發規範、當前挑戰與任務——依序對應 `01-goals.md` ~ `07-current-tasks.md`
- 索引本身（`README-AI.md`）僅在章節新增/移除、或版本號變動時才需要修改

### 9. 操作手冊同步（功能異動）
- 只要有任何功能異動（新增/修改/移除功能），都必須同步檢查並修正 `doc/` 下三份操作手冊，依異動影響的角色判斷需更新的章節（流程、按鈕、權限、路由）：
  - `doc/管理者操作手冊.md`
  - `doc/老師手冊.md`
  - `doc/學員手冊.md`
- 修正手冊後須一併更新各檔檔首的版本標註與日期，並比照第 7 點將 `config/version.json` 的 patch 版本號 +1

### 10. 外寄信件收件人解析（通用規則）
- 所有對使用者的外寄信（臨時密碼、密碼重設等）一律透過 `resolveContactEmail(user)`（`lib/utils/contact-email.ts`）決定收件地址：**優先使用已驗證的通訊 Email（`isCommVerified && commEmail`），否則退回帳號 `email`**。
- 呼叫端查詢 `User` 時須 select `email`、`commEmail`、`isCommVerified`，再傳解析結果給 mailer。
- **例外**：通訊 Email 驗證信（`sendCommEmailVerification`）仍寄至「待驗證的 `commEmail`」，不套用此規則（否則無法完成驗證）。

### 11. 路由存取與分組（免登入頁面/API 管理）
- **單一事實來源**：免登入頁面/API 與訪客頁一律宣告於 `lib/auth/route-access.ts`（`PUBLIC_PAGES` / `PUBLIC_APIS` / `GUEST_PAGES`，每筆附 `reason`）。`middleware.ts` 與 `app/(user)/layout.tsx` 共用其 `isPublicRoute` / `isGuestRoute`，**禁止**在他處另列免登入路由清單。
  - ⚠️ 此模組由 Edge runtime 載入：僅可用純字串/正規表達式，不得引入 `prisma`、Node-only API 或重量相依。
  - i18n 預留：比對前以 `stripLocale()` 剝除可能的 `/<locale>` 前綴。
- **依權限層級分組（route group，URL 不變），group `layout.tsx` 即守衛**：
  - `app/(guest)/`：免登入頁（首頁、登入/註冊/找回帳號、terms/privacy、以及自行 `auth()` 處理的 onboarding/change-password/account-suspended）。layout 為薄 passthrough，**不可**盲目把已登入者導走。
  - `app/(user)/`：需登入頁；layout 做登入 + 暫停 + 臨時密碼 + profile 完整度守衛 + Topbar。
  - `app/(admin)/`：需 admin 身分；layout 在 `(user)` 守衛之上再加 `canAccessAdmin`。**後台各頁不得自行重複** session / `canAccessAdmin` 轉導判定。
- **新增免登入頁面/API 時**：①在 `lib/auth/route-access.ts` 註冊（附 reason）；②頁面放入對應 `(guest)`／`(user)`／`(admin)` group。新增受 admin 保護頁只需放進 `(admin)/`，不需在頁面內寫守衛。
- ⚠️ 路由實體位於 `app/[locale]/(guest|user|admin)/*`（見第 12 點 i18n）；route-access 的判定以 `stripLocale` 後路徑為準，與 locale 前綴無關。

### 12. 多語系 i18n（next-intl）
- **語言**：`zh-TW`（預設、無前綴）/ `en`（`/en`）/ `zh-CN`（`/zh-CN`）。設定於 `i18n/routing.ts`、`i18n/request.ts`、`i18n/navigation.ts`；頁面路由全部位於 `app/[locale]/` 之下，`<html lang>` 由 `app/[locale]/layout.tsx` 提供（已無 `app/layout.tsx`）。
- **訊息目錄**：`messages/zh-TW.json` 為**唯一事實來源**（繁體），`messages/en.json` 為英文翻譯，`messages/zh-CN.json` 為 **OpenCC 自動產生**（`npm run gen:zh-cn`，`prebuild` 自動跑）。
- **新增 UI 文案規範**：①一律加入 `messages/zh-TW.json`（依命名空間，如 `common`/`auth`/`nav`）並補 `messages/en.json`；②**不得在元件寫死中文**，以 key 取用——server 元件用 `getTranslations`、client 元件用 `useTranslations`；③**簡體勿手改**，改繁體來源後重新產生。
- **缺 key 行為**：非預設語言缺 key 會逐層回退顯示繁體（`i18n/request.ts` deepMerge），支援漸進遷移；既有未遷移字串維持繁體顯示。
- **連結與導向**：需 locale 感知時用 `@/i18n/navigation` 的 `Link`/`useRouter`/`usePathname`。
- **命名空間**：`common`/`nav`/`auth`/`language`/`validation`/`status`/`role`/`catalog`…依功能分。
- **驗證訊息（Zod）**：schema 的訊息一律放 `validation.*` **key**（不寫死中文）；表單以共用元件 `<FieldError message={errors.x?.message} />`（`components/ui/field-error.tsx`，內部 `t()`）呈現；server action 回傳的 `errors` 為 key，toast 顯示時 `t(key)`（`result.message` 為動作層文案、非 key，維持原樣）。
- **enum/標籤**：共用標籤的 **React 顯示**用 i18n（如 `status`/`role`/`catalog` 命名空間、`useTranslations`）；**非 React／匯出**情境（如 Excel 匯出）保留既有 `*_LABELS` map。
- **漸進遷移**：schema key 化採「全有全無」——key 化某 schema 時，其所有呈現端須同批改用 `t()`/`<FieldError>`，否則顯示原始 key。後台與其專屬字串本階段維持繁體。

### 13. 對外絕對網址建構（dev tunnel 安全）
- 對外絕對網址（寄信連結、跨站導向）一律透過 `lib/utils/app-url.ts` 建構：
  - **無 request 情境**（server action 寄信/通知連結）用 `getAppUrl()`（讀 `NEXTAUTH_URL`）。
  - **route handler 導向**用 `getRequestBaseUrl(req)`（依 `x-forwarded-host`/`x-forwarded-proto` 還原對外網域）。
- ⚠️ **route handler 禁止用 `req.url` / `req.nextUrl.origin` 建對外網址**：開發經 Cloudflare Tunnel 時其 host 會是內部 `localhost:3000`，導致導向落到瀏覽器無法到達的位址（曾於 `/api/verify-email` 踩坑）。
- 不要散落 `process.env.NEXTAUTH_URL` 字串拼接，改用 `getAppUrl()`。

## Database Schema Notes

### User Models (user.prisma)
- `User.id` uses UUID (`@db.Uuid`)
- `UserRole` enum: user, admin, superadmin
- NextAuth tables: Account, Session, VerificationToken
- `WhitelistedEmail` table controls access

### Project Models (project.prisma)
- `Project.id` uses auto-increment (traditional serial)
- `ProjectStatus` enum: 9 statuses (quoting → closed)
- `TimeEntry` tracks start/end times + duration
- `ProjectCounter` ensures unique project codes per type/year

### Important Relations
- `User.timeEntries` ↔ `TimeEntry.user`
- `Project.timeEntries` ↔ `TimeEntry.project`
- Cascading deletes configured on foreign keys

## Environment Variables

Required in `.env` (see `.env.example`):
```bash
DATABASE_URL_DEV      # Local PostgreSQL connection
DATABASE_URL_VPS3     # Remote PostgreSQL via SSH tunnel
GOOGLE_CLIENT_ID      # Google OAuth credentials
GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET       # JWT signing secret
NEXTAUTH_URL          # Application URL
```

## Testing Commands

```bash
# No formal test suite currently
# Test manually:
npm run build         # Verify production build
npm run lint          # Check code style
make schema-update    # Verify schema changes
```

## Deployment Notes

- **Build Mode:** `output: "standalone"` in next.config.ts
- **Docker:** Uses multi-stage builds (dev/prod configurations)
- **Database:** Migrations via `prisma migrate deploy`
- **Images:** Pushed to Docker Hub (`jaliao/bc-erp-web`, `jaliao/bc-erp-db`)

## Key Files to Review

- `lib/auth.ts` - Authentication logic and callbacks
- `lib/prisma.ts` - Database client configuration
- `app/(user)/layout.tsx` - Authenticated layout wrapper
- `app/middleware.ts` - Request-level auth checks
- `app/actions/project.ts` - Project CRUD operations
- `app/actions/time-entry.ts` - Time tracking operations
- `config/project-status.ts` - Status configuration
- `hooks/use-timer.ts` - Timer implementation

## Common Pitfalls

1. **Prisma Client Path:** Import from `@prisma/client`, not direct path (tsconfig paths configured)
2. **Session Validation:** Always check `auth()` in Server Actions before database operations
3. **Transactions:** Use `prisma.$transaction()` for multi-table updates (especially time entries + project hours)
4. **revalidatePath:** Call after mutations to refresh server component data
5. **Suspense Boundaries:** Wrap client components using `useSearchParams()` in `<Suspense>`
6. **npm Install:** Use `--legacy-peer-deps` flag due to dependency conflicts

## Makefile Reference

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make dev` | Start Docker PostgreSQL |
| `make dev-clean` | Clean and restart environment |
| `make schema-update` | Full schema update (recommended) |
| `make schema-update name=xxx` | Full schema update with custom migration name |
| `make schema-quick` | Quick update without migration |
| `make clean` | Clean Docker containers and volumes |
| `make db-shell` | PostgreSQL CLI |
| `make prisma-vps3-deploy` | Deploy to remote VPS |
| `make prisma-dev-status` | 檢查 Dev Migration 狀態（建議先跑） |
| `make prisma-dev-deploy` | 部署 migrations 到 VPS3（正式/遠端 DB 用） |
| `make prisma-dev-seed` | Seed database (local dev) |
| `make prisma-dev-studio` | Open Prisma Studio (local dev) |

## 重置開發環境資料庫步驟

`make dev-clean`
`make dev`
`make prisma-dev-status`
`make prisma-dev-deploy`
`make prisma-dev-seed`

### 破壞性 schema 變更（移除 enum 值等）的重置

移除 enum 值（例如自 `UserRole` 移除 `teacher_4`）屬破壞性變更：若現有 DB 仍有資料使用該值，`prisma migrate dev` / `make schema-update` 會卡住要求 reset，於非互動環境直接中止。正確程序是**先清空 DB 再建立 migration**：

1. `make dev-clean`（`down -v` 清空 volume，DB 全空 → 無資料使用待移除的值）
2. `make dev`（前台啟動容器，於專屬終端執行；含 cloudflared tunnel）
3. `make schema-update name=<描述>`（於空 DB 上 `migrate dev`：套用既有 migrations + 建立移除 enum 的新 migration，因無資料使用該值故不卡）
4. `make prisma-dev-seed`

> ⚠️ `make dev` / `make dev-clean` 為前台 `up --build` 並啟動 cloudflared tunnel，請於你自己的終端執行（不適合背景／自動執行）。

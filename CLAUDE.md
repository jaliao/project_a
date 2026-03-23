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
- 每次 `/opsx:apply` 套用變更時，須自動將 `config/version.json` 的 patch 版本號 +1（例如 `0.1.0` → `0.1.1`）
- 版本號格式為 SemVer（`major.minor.patch`）
- `config/version.json` 是版本號的唯一來源，側邊欄底部會顯示對應版本

### 8. README-AI.md Update
- 每次 `/opsx:apply` 套用變更後，須依照 `.ai-rules.md` 的規範重新產生 `README-AI.md`
- 更新內容須反映最新的版本號、資料模型、路由結構、業務邏輯與當前任務狀態
- 參照 `.ai-rules.md` 定義的七大章節結構：專案核心目標、技術棧、系統架構、核心資料模型、關鍵業務邏輯、開發規範、當前挑戰與任務

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
| `make prisma-seed` | Seed database (local) |
| `make prisma-studio` | Open Prisma Studio |
| `make clean` | Clean Docker containers and volumes |
| `make db-shell` | PostgreSQL CLI |
| `make prisma-vps3-deploy` | Deploy to remote VPS |

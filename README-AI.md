# README-AI.md

> 自動產生，版本 0.1.6（2026-03-23）
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
├── dashboard/
│   ├── stats-card.tsx      # 統計卡片
│   ├── recent-members.tsx  # 近期加入會員列表
│   └── profile-banner.tsx  # 資料完整度提醒 / 歡迎訊息（Server Component）
├── course-order/
│   ├── course-order-dialog.tsx  # 訂購 Dialog 殼
│   └── course-order-form.tsx    # 訂購表單（RadioGroup + 條件欄位）
├── course-invite/
│   ├── create-invite-dialog.tsx # 建立邀請 Dialog
│   ├── create-invite-form.tsx   # 建立邀請表單 + 複製連結 View
│   └── invite-copy-button.tsx   # 複製邀請連結按鈕（Client）
├── profile/
│   └── sign-out-section.tsx     # 登出按鈕區塊（Client）
└── learning/
    └── level-progress.tsx       # 學習等級進度視覺元件

lib/
├── auth.ts          # NextAuth 設定（JWT + Google + Credentials）
├── prisma.ts        # Prisma client singleton
├── spirit-id.ts     # Spirit ID 產生器
├── schemas/         # Zod 驗證 schema
└── utils.ts         # cn() 等工具函數

prisma/
├── schema/
│   ├── base.prisma          # generator + datasource
│   ├── user.prisma          # User, Account, Session, WhitelistedEmail
│   ├── course-order.prisma  # CourseOrder + enums
│   └── course-invite.prisma # CourseInvite + InviteEnrollment
└── seed.ts

config/
├── version.json       # 版本號（SemVer 唯一來源）
├── course-catalog.ts  # 課程目錄設定（啟動靈人 1～4，含 isActive、prerequisiteLevel）
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
nickname      String?（自訂暱稱，最多 20 字）
phone         String?
address       String?
createdAt / updatedAt / lastLoginAt
```

### WhitelistedEmail
```
email     String（唯一）
isActive  Boolean（控制登入許可）
```

### CourseInvite
```
id            Int（主鍵）
token         String（唯一，12-char hex）
title         String（課程名稱，由 courseLevel label 自動填入）
courseLevel   CourseLevel（level1|level2|level3|level4，預設 level1）
maxCount      Int（預計人數）
courseOrderId Int?（選填關聯 CourseOrder）
createdById   String（建立者 UUID）
createdAt     DateTime
```

### InviteEnrollment
```
id        Int（主鍵）
inviteId  Int（關聯 CourseInvite）
userId    String（學員 UUID）
joinedAt  DateTime
@@unique([inviteId, userId])
```

### CourseOrder
```
id              Int（主鍵，autoincrement）
buyerNameZh     String（購買人中文姓名）
buyerNameEn     String（購買人英文姓名）
teacherName     String（教師姓名）
churchOrg       String（所屬教會/單位）
email           String
phone           String
materialVersion MaterialVersion（traditional | simplified | both）
purchaseType    PurchaseType（selfOnly | selfAndProxy | proxyOnly）
studentNames    String?（代購學員姓名，代購時必填）
quantity        Int（1–8；選「其他」時為 0）
quantityNote    String?（自填數量說明）
courseDate      String（預計開課日期，可為「無」）
taxId           String?（統一編號，選填）
deliveryMethod  DeliveryMethod（sevenEleven | familyMart | delivery）
submittedById   String?（提交者 UUID，選填關聯 User）
createdAt       DateTime
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
- `cr-spec-260323-006` — 課程訂購表單（CourseOrder Dialog + DB 模型）
- `cr-spec-260323-007` — 開課邀請系統（邀請碼/連結、學員加入、進度追蹤）
- `cr-spec-260323-008` — 會員資料完整度提醒、暱稱欄位、Profile 登出按鈕
- `cr-spec-260323-009` — 課程目錄（啟動靈人 1～4）、先修驗證、學習紀錄頁面

### 進行中 / 待規劃
- 訂單管理後台（列表、狀態管理）
- 訊息通知系統（Topbar「訊息」預留入口）
- 會員管理後台（CRUD、搜尋、分頁）

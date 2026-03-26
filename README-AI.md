# README-AI.md

> 自動產生，版本 0.1.20（2026-03-26）
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
│   ├── layout.tsx   # Topbar 包裝層（含未讀通知數 server fetch）
│   ├── dashboard/       # redirect → /user/{id}（舊書籤相容）
│   ├── admin/           # 管理後台：統計卡片 + 已新增開課預覽 + 近期活動
│   ├── user/[id]/       # 學員專屬頁面：基本資料（姓名、身分標籤、已完成課程）+ 本人功能單元
│   ├── user/[id]/courses/ # 我的開課列表（本人專屬，Spirit ID 小寫路由）
│   ├── course-sessions/ # 開課查詢頁（保留，將逐步以 /user/[id]/courses 取代）
│   ├── notifications/   # 通知歷史頁面（分頁，每頁 20 則）
│   ├── course/[id]/     # 課程詳情頁（授課老師、學員名單、取消課程、結業申請）
│   ├── learning/        # 學習紀錄頁面
│   └── profile/         # 個人資料維護
├── change-password/ # 臨時密碼強制變更
├── api/auth/        # NextAuth handlers
├── middleware.ts    # 未登入攔截 + 臨時密碼強制導向
└── layout.tsx       # Root layout（Toaster）

components/
├── ui/              # shadcn/ui 基礎元件
├── layout/
│   └── topbar.tsx   # 頂部工具列（新增課程/個人資料/訊息通知 Drawer）
├── notification/
│   └── notification-drawer.tsx  # 右側通知 Drawer（Sheet，lazy load，標記已讀）
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
├── course-session/
│   ├── course-session-dialog.tsx  # 新增開課 Dialog（合併訂購 + 邀請）
│   ├── course-session-form.tsx    # 合併表單（DatePicker、課程 Select、DEV 預填）
│   ├── course-session-card.tsx    # 開課卡片共用元件（compact / full variant，支援 href 連結）
│   ├── cancel-course-dialog.tsx   # 取消課程確認 Dialog（下拉選單 + 自填 textarea）
│   └── enrolled-students-list.tsx # 已接受邀請學員清單（Server Component）
├── profile/
│   └── sign-out-section.tsx     # 登出按鈕區塊（Client）
└── learning/
    └── level-progress.tsx       # 學習等級進度視覺元件

lib/
├── auth.ts          # NextAuth 設定（JWT + Google + Credentials）
├── prisma.ts        # Prisma client singleton
├── spirit-id.ts     # Spirit ID 產生器
├── schemas/         # Zod 驗證 schema
├── data/
│   ├── user.ts              # 使用者資料查詢
│   ├── password-reset.ts    # 密碼重設查詢
│   ├── course-sessions.ts   # 開課記錄查詢（getMyCourseSessions, getMyCourseSessionCount, getCourseSessionById）
│   └── notification.ts      # 通知查詢（getNotifications, getUnreadNotificationCount, getNotificationsPaginated）
└── utils.ts         # cn() 等工具函數

prisma/
├── schema/
│   ├── base.prisma          # generator + datasource
│   ├── user.prisma          # User, Account, Session, WhitelistedEmail, Notification
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
learningLevel Int（預設 0；1～4 對應已完成的啟動靈人課程等級）
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

### Notification
```
id        Int（主鍵，autoincrement）
userId    String（關聯 User UUID）
title     String
body      String（Text）
isRead    Boolean（預設 false）
readAt    DateTime?（標記已讀時間）
createdAt DateTime
```

### CourseInvite
```
id            Int（主鍵）
token         String（唯一，12-char hex）
title         String（課程名稱，由 courseLevel label 自動填入）
courseLevel   CourseLevel（level1|level2|level3|level4，預設 level1）
maxCount      Int（預計人數）
expiredAt     DateTime?（邀請截止日期，選填）
courseOrderId Int?（選填關聯 CourseOrder）
createdById   String（建立者 UUID）
createdAt     DateTime
cancelledAt   DateTime?（有值代表已取消）
cancelReason  String?（取消原因文字）
completedAt   DateTime?（有值代表已結業）
```

### InviteEnrollment
```
id             Int（主鍵）
inviteId       Int（關聯 CourseInvite）
userId         String（學員 UUID）
status         EnrollmentStatus（pending | approved，預設 pending）
materialChoice MaterialChoice（none | traditional | simplified，預設 none）
joinedAt       DateTime
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
5. **登入後預設導向** — `/user/{currentUserId}`（學員專屬頁面）

### Spirit ID 核發
- 格式：`PA` + 年份後兩碼 + 4 位流水號（例 `PA261001`）
- 首次 Google 登入自動觸發核發

### 學員身分標籤（learningLevel）
- `learningLevel` 0：無標籤
- `learningLevel` 1～4：對應「啟動靈人 N 學員」Badge

---

## 6. 開發規範

- **語言**：繁體中文（註解、文件）
- **元件預設**：Server Component，僅互動部分加 `"use client"`
- **資料查詢**：`lib/data/`（多處複用）或 Server Action 直接 Prisma（單一用途）
- **表單**：Zod schema → React Hook Form → Server Action → ActionResponse → Sonner toast
- **通知整合**：關鍵操作（開課完成、取消課程、學員核准、課程結業）成功後以 fire-and-forget 呼叫 `createNotification`，同步寫入 Inbox；toast 呈現不變
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
- `cr-spec-260323-010` — 新增開課（合併訂購 + 邀請表單、DatePicker、學員清單、expiredAt）
- `cr-spec-260324-001` — 系統管理員初始化（prisma/seed.ts，justin@blockcode.com.tw，superadmin）
- `cr-spec-260324-005` — Dashboard 功能單元重組（學習/授課/管理者三區塊，角色判斷）
- `cr-spec-260324-006` — 學習單元依角色隱藏（admin/superadmin 不顯示學習單元）
- `cr-spec-260324-008` — 學員測試帳號（seed.ts 新增 4 位學員，student1~4@test.com，密碼 Student@1234）
- `cr-spec-260324-009` — Dashboard 開課預覽（已新增開課卡片列表）+ 開課查詢頁（`/course-sessions`）+ 共用 CourseSessionCard
- `cr-spec-260324-011` — 課程詳情頁（`/course/[id]`）：授課老師、已接受學員名單、取消課程（Dialog + 原因下拉）、結業申請（佔位）；CourseSessionCard 支援點擊導航
- `cr-spec-260324-012` — 課程詳情頁進階設計：基本資訊區塊、角色差異化（講師/學員）、申請審核流程（pending→approved）、書籍選購（無須/繁體/簡體）、複製邀請連結、結業操作；InviteEnrollment 加 status + materialChoice
- `cr-spec-260324-013` — 學員專屬頁面 `/user/{id}`（基本資料單元：姓名、身分標籤、已完成課程）；`/dashboard` 搬移至 `/admin`；登入後預設導向改為 `/user/{id}`
- `cr-spec-260324-014` — 學員頁面完善：Spirit ID URL 小寫（`/user/pa260001`）、ProfileBanner/授課/管理者單元移至本人頁面、新增 `/user/{spiritId}/courses` 我的開課頁面、`User.learningLevel` 欄位
- `cr-spec-260324-007` — 訊息通知系統：Notification DB model、右側 Drawer（Sheet）、未讀 Badge、標記已讀、`/notifications` 歷史頁面（分頁）
- `cr-spec-260326-007` — Toast + Inbox 通知整合：`createNotification` 工具函數、開課完成 / 取消課程 / 學員審核通過 / 課程結業 四個操作自動寫入 Inbox
- `cr-spec-260326-008` — 學員申請流程完善：`EnrollmentApplicationDialog` 新增課程資訊確認區塊（課程名稱、講師、開課日期）；`applyToCourse` 成功後通知講師有新申請
- `cr-spec-260326-010` — 學員課程三狀態列表：學員頁面課程區塊改為申請中 / 已開課 / 已結業三分組，以 `CourseSessionCard` 呈現；新增 `getMyEnrollments` data layer 查詢

### 進行中 / 待規劃
- 訂單管理後台（列表、狀態管理）
- 會員管理後台（CRUD、搜尋、分頁）

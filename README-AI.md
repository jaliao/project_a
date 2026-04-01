# README-AI.md

> 自動產生，版本 0.1.43（2026-04-01）
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
│   ├── admin/materials/ # 教材申請管理（管理者查看、確認已寄送）
│   ├── course/[id]/     # 課程詳情頁（授課老師、學員名單、取消課程、教材申請）
│   ├── course/[id]/graduate/  # 課程結業表單頁（填寫→預覽→送出）
│   ├── learning/        # 學習紀錄頁面
│   └── profile/         # 個人資料維護
├── change-password/ # 臨時密碼強制變更
├── api/auth/        # NextAuth handlers
├── api/ecpay/
│   ├── store-map/       # GET：產生 ECPay MapCVS auto-submit form（Mock 模式支援）
│   └── store-callback/  # POST：接收 ECPay 門市選擇結果，postMessage 回前端後關閉視窗
├── middleware.ts    # 未登入攔截 + 臨時密碼強制導向
└── layout.tsx       # Root layout（Toaster）

components/
├── ui/              # shadcn/ui 基礎元件
├── layout/
│   └── topbar.tsx   # 頂部工具列（sticky；個人資料/訊息通知 Drawer）
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
│   ├── create-invite-form.tsx   # 建立邀請表單 + 分享連結 View（Web Share API + clipboard fallback）
│   ├── invite-copy-button.tsx   # 分享邀請連結按鈕（Client；Web Share API + clipboard fallback）
│   └── completion-certificate-card.tsx  # 結業證明卡片（courseCatalogLabel、title、teacherName、graduatedAt）
├── admin/
│   └── material-order-table.tsx  # 教材申請管理表格（狀態 Badge、確認已寄送、展開詳情）
├── ecpay-store-selector/
│   └── store-selector.tsx   # ECPay MapCVS 超商門市選擇器（7-11 UNIMART / 全家 FAMI，postMessage 同源）
├── course-session/
│   ├── course-session-dialog.tsx  # 新增開課 Dialog 入口（含 canTeach disabled gate + tooltip）
│   ├── course-session-form.tsx    # 舊版合併表單（保留，目前精靈流程未使用）
│   ├── course-session-card.tsx    # 開課卡片共用元件（compact / full variant，支援 href 連結）
│   ├── course-card-grid.tsx       # 課程卡片響應式網格容器（1→2→3→4 欄 RWD）
│   ├── cancel-course-dialog.tsx   # 取消課程確認 Dialog（下拉選單 + 自填 textarea）
│   ├── material-order-dialog.tsx  # 教材申請 Dialog（預填資料、EcpayStoreSelector（7-11/全家）、已寄送唯讀模式）
│   ├── enrolled-students-list.tsx # 已接受邀請學員清單（Server Component）
│   └── create-course-wizard/
│       ├── create-course-wizard.tsx   # 精靈主容器（step 1|2|3|'invite' 狀態機）
│       ├── step-1-course-card.tsx     # 卡片式課程選擇（isActive 課程 + 資格提示）
│       ├── step-2-basic-info.tsx      # 基本資料表單（課程名稱、人數、DatePicker）
│       ├── step-3-preview.tsx         # 預覽確認（唯讀摘要 → createCourseSession）
│       └── invite-step.tsx            # 邀請學員（複製連結 + Spirit ID 邀請）
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
│   ├── course-sessions.ts   # 開課記錄查詢（getMyCourseSessions, getMyCourseSessionCount, getCourseSessionById, getMyEnrollments, getMyCompletionCertificates）
│   ├── course-catalog.ts    # 課程目錄查詢（getAllCourses, getActiveCourses, getCourse, checkPrerequisites, getGraduatedCatalogIds）
│   ├── course-order.ts      # 課程訂購查詢（getCourseOrderByInviteId, getAllCourseOrdersWithInvite）
│   └── notification.ts      # 通知查詢（getNotifications, getUnreadNotificationCount, getNotificationsPaginated）
├── ecpay/
│   └── logistics.ts         # ECPay 物流工具（calcLogisticsCheckMacValue，MD5，物流 CMV-MD5 規格）
└── utils.ts         # cn() 等工具函數

prisma/
├── schema/
│   ├── base.prisma           # generator + datasource
│   ├── user.prisma           # User, Account, Session, WhitelistedEmail, Notification
│   ├── course-order.prisma   # CourseOrder + enums
│   ├── course-invite.prisma  # CourseInvite + InviteEnrollment
│   └── course-catalog.prisma # CourseCatalog（id, label, description?, isActive, sortOrder, prerequisites 自關聯）
└── seed.ts

config/
├── version.json          # 版本號（SemVer 唯一來源）
└── project-status.ts, project-type.ts
```

---

## 4. 核心資料模型

### CourseCatalog
```
id            Int（主鍵，autoincrement）
label         String（課程名稱，DB 唯一來源）
description   String?（課程簡介，選填）
isActive      Boolean（預設 false；true 才可開課）
sortOrder     Int（預設 0；決定顯示順序）
prerequisites CourseCatalog[]（多對多自關聯，_CoursePrerequisites join table，累積式：啟動靈人 N 需先修 1..N-1）
```

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
title         String（課程名稱，由 courseCatalog.label 自動填入）
courseCatalogId Int（關聯 CourseCatalog）
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
graduatedAt          DateTime?（結業時間；有值代表通過結業）
nonGraduateReason    String?（未結業原因：insufficient_time | other）
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
deliveryAddress String?（收件地址，全家/郵寄用）
storeId         String?（超商門市店號，透過 ECPay MapCVS 選擇器取得）
storeName       String?（超商門市名稱，透過 ECPay MapCVS 選擇器取得）
submittedById   String?（提交者 UUID，選填關聯 User）
shippedAt       DateTime?（管理者確認寄送時間）
receivedAt      DateTime?（講師確認收件時間）
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

### 課程目錄管理
- `CourseCatalog` 為 DB 唯一來源（不使用 `config/course-catalog.ts`）
- Admin UI：`/admin/course-catalog`；可設定名稱、isActive、先修課程（多選）
- `isActive = true` 才可被選為開課目標
- 先修驗證：`checkPrerequisites(userId, catalogId)` 回傳未完成先修清單（空 = 通過）
- 結業後 `InviteEnrollment.graduatedAt` 有值，`getGraduatedCatalogIds(userId)` 回傳 Set

### 身分標籤
- 來源：`User.role`（管理者）+ `InviteEnrollment.graduatedAt`（講師，以結業證書 courseCatalogLabel 推導）
- `role = admin | superadmin` → 顯示「系統管理員」Badge
- 有結業證書 → 顯示「{courseCatalogLabel} 講師」Badge（可多標籤）

### 開課身分驗證
- `canTeach = isAdmin || certificates.length > 0`（certificates = getMyCompletionCertificates）
- 精靈 Step 1：卡片資格判斷 = `isAdmin || graduatedCatalogIds.includes(course.id)`（結業該課程本身）
- `canTeach = false` → 按鈕 disabled + tooltip「需具備講師身分才能開課」
- Server Action 層仍保留先修驗證（defense-in-depth）

### 新增授課精靈（三步驟）
1. **Step 1**：卡片式課程選擇（DB 課程列表；顯示先修條件說明）
2. **Step 2**：基本資料（課程名稱、人數、開課日期、截止日期、備註）
3. **Step 3**：預覽確認 → 呼叫 `createCourseSession` → 進入邀請學員階段
- **邀請階段**：複製課程連結 `/course/{id}` 或填寫 Spirit ID → `inviteBySpirtId` → 發送 Inbox 通知

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
- `cr-spec-260326-011` — 課程狀態與開課功能：新增 `startedAt` 欄位（migration）、`startCourseSession` action、課程詳情頁「開始上課」按鈕；`CourseSessionCard` 新增狀態 Badge（招生中/進行中/已結業/已取消）與進度 bar；學員課程列表 RWD 網格
- `cr-spec-260326-009` — 效能優化（Turbopack）：開發環境改用 Turbopack（降低 HMR OOM 風險）、heap 上限 4096→6144 MB、`markNotificationRead` 改精確 revalidatePath 避免全站重渲染
- `cr-spec-260326-012` — UI 改善批次：新增 `CourseCardGrid` 共用 RWD 網格元件（1→2→3→4 欄）；首頁課程區塊改為單一平鋪列表（移除三分組）；我的開課頁補傳狀態欄位；Topbar 改為 sticky + 移除新增課程按鈕
- `cr-spec-260326-013` — 首頁授課單元改善：授課單元顯示最近 3 筆授課卡片 + 超過 3 筆顯示「更多授課資訊」卡片；CourseInvite 新增 courseDate/notes 欄位；新增授課表單簡化（移除教材訂購欄位，新增可編輯課程名稱與備註）
- `cr-refactor-260326-001` — 移除 token-based 邀請連結（`/invite/[token]`）；改由分享 `/course/{id}` 直接連結，學員至課程頁面申請；移除 `CourseInvite.token` DB 欄位、`joinInvite()` action、公開路由；複製按鈕改為複製課程 URL
- `cr-spec-260326-014` — 結業系統完整實作：`InviteEnrollment.graduatedAt` 欄位（migration）；`graduateCourse()` 接收 graduatedUserIds 批次寫入；`GraduationDialog` 結業確認 Dialog（預設全選已核准學員、空選禁止送出）；分享按鈕改 Web Share API + clipboard fallback；`getMyCompletionCertificates` 查詢以 courseLevel 去重；`CompletionCertificateCard` 結業證明卡片；學員頁面新增「結業證明」+ 「學習紀錄」預覽區塊；學習紀錄頁新增「結業紀錄」區塊

- `cr-spec-260327-001` — 課程結業頁面：移除 GraduationDialog，改為獨立頁面 `/course/[id]/graduate`；三步驟流程（填寫→預覽→送出）；新增最後一堂課程日期欄位；未結業原因下拉（時間不足/其他）；`InviteEnrollment.nonGraduateReason` 欄位；`graduateCourse` action 更新介面

- `cr-spec-260327-002` — 課程詳情頁結業資訊：已結業課程新增「結業資訊」區塊（最後課程日期、已結業／未結業學員清單含原因）；data layer 補充 `nonGraduateReason` 欄位

- `cr-spec-260328-001` — 身分標籤多標籤：學員頁面身分標籤改為多 Badge（系統管理員依 role、啟動靈人 N 講師依結業證書），移除舊 learningLevel 學員標籤
- `cr-spec-260330-001` — 授課精靈流程：新增授課改為三步驟精靈（卡片選課→基本資料→預覽確認）；入口加講師身分前置檢核（canTeach）；邀請學員階段新增 Spirit ID 邀請方式（`inviteBySpirtId` → Inbox 通知）
- `cr-spec-260330-002` — 課程目錄 DB 化：移除 `CourseLevel` enum 與 `config/course-catalog.ts`；新增 `CourseCatalog` DB model（id/label/isActive/sortOrder/prerequisites 多對多自關聯）；Admin UI 維護課程名稱、isActive、先修關係；先修驗證改為 DB Set 比對；所有課程名稱顯示改為讀取 `CourseCatalog.label`；`LevelProgress` 元件改為 DB 課程清單 + 已結業 id 集合
- `cr-spec-260330-003` — 先修資料累積修正 + 課程簡介欄位：`CourseCatalog` 新增 `description` 欄位；seed 改為累積式先修；Admin 課程列表顯示簡介；編輯 Dialog 新增簡介 Textarea
- `cr-spec-260330-006` — 啟動靈人 1 先修清除：migration 刪除 join table 殘留；seed 補顯式清除
- `cr-fix-260330-001` — Makefile prisma studio `--browser none`：修正 WSL2 缺少 `xdg-open` 導致 studio 指令崩潰：migration 刪除 join table 中 A=1 的殘留資料；seed 補顯式 set:[] 確保入門課程永遠無先修：`CourseCatalog` 新增 `description` 欄位（選填）；seed 改為累積式先修（啟動靈人 N 需先修 1..N-1）；Admin 課程列表顯示簡介（line-clamp-2）；編輯 Dialog 新增簡介 Textarea
- `cr-spec-260330-004` — 申請按鈕先修資格前置檢查：`/course/[id]` 頁面呼叫 `checkPrerequisites`；不符資格時按鈕 disabled，下方顯示缺少先修課程清單
- `cr-spec-260330-005` — 教材申請作業流程：`CourseOrder` 新增 `shippedAt`/`receivedAt` 欄位；課程詳情頁新增「申請教材」按鈕（預填 Profile 資料）、寄送狀態提示、「我已收到教材」確認收件；「開始上課」前置條件改為 `receivedAt != null`；後台新增 `/admin/materials` 教材申請管理頁（列表、狀態 Badge、確認已寄送、展開詳情）
- `cr-fix-260330-002` — 授課資格判斷修正：精靈 Step 1 `hasQualification` 從「完成先修課程」改為「結業該課程本身」（`graduatedCatalogIds.includes(course.id)`）；提示文字從顯示先修課程名稱改為顯示課程本身名稱
- `cr-spec-260330-007` — 教材作業優化：`CourseOrder` 新增 `deliveryAddress` 欄位（migration）；教材申請表單移除書籍相關欄位（materialVersion/purchaseType/studentNames/quantity），改由學員 `materialChoice` 自動統計；新增出貨單列印頁 `/admin/materials/[id]/print`（收件者、寄件方式、地址、書本數量）；後台管理表格新增「列印」按鈕
- `cr-spec-260330-008` — 7-11 門市選擇器整合：`CourseOrder` 新增 `storeId`/`storeName` 欄位（migration）；教材申請表單選擇 7-11 取貨時以 `StoreSelector711` 元件取代文字輸入（`window.open` + `postMessage`）；Zod schema 條件驗證（7-11 必須選取門市）；後台管理頁優先顯示結構化門市資訊，舊資料 fallback 至 `deliveryAddress`
- `cr-spec-260331-002` — ECPay MapCVS 超商門市選擇器整合：以 ECPay 官方物流 API 取代 7-11 非正式 Map URL；新增 `/api/ecpay/store-map`（Server 端產生 CheckMacValue form，mock 模式支援）與 `/api/ecpay/store-callback`（接收 ECPay POST → postMessage 同源回前端）；新增 `EcpayStoreSelector` 元件支援 UNIMART / FAMI；全家取貨現可選取門市（先前為文字輸入）；移除 `StoreSelector711` 與 `NEXT_PUBLIC_711_MAP_URL`；`lib/ecpay/logistics.ts` 實作 MD5 CheckMacValue

### 開課身分驗證（修正後）
- `canTeach = isAdmin || certificates.length > 0`（入口顯示控制）
- 精靈 Step 1 卡片資格：`isAdmin || graduatedCatalogIds.includes(course.id)`（結業該課程本身才能授課）

### 進行中 / 待規劃
- 會員管理後台（CRUD、搜尋、分頁）

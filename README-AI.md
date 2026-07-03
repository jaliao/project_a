# README-AI.md

> 自動產生，版本 0.1.123（2026-07-03）
> 供 AI 輔助開發使用，反映當前系統狀態。

---

## 1. 專案核心目標

**啟動事工**（project_a）是一套面向課程教學機構的會員管理 ERP 平台。
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
| 多語系 | next-intl 4（zh-TW 預設 / en / zh-CN；path-prefix as-needed；簡體由 OpenCC 自動產生） |
| 資料庫 | PostgreSQL（Docker 開發，VPS3 生產） |
| 運行環境 | Docker（standalone build） |
| 工具 | date-fns 4、bcryptjs、Zod、React Hook Form、Sonner |

---

## 3. 系統架構

```
app/
# i18n：頁面路由全部位於 app/[locale]/ 之下（next-intl，zh-TW 預設無前綴 / en / zh-CN）；
#       <html lang> 由 app/[locale]/layout.tsx 提供（已無 app/layout.tsx）；api/ 不在地化
# 路由依「權限層級」分組（route group () 不影響 URL），各 group layout 即守衛；
# 免登入頁面/API 的單一事實來源為 lib/auth/route-access.ts（middleware 與 layout 共用）
├── [locale]/        # i18n 根：層下含 (guest)/(user)/(admin) 三群組
├── (guest)/         # 免登入群組（薄 passthrough layout，不擋已登入者）
│   ├── page.tsx         # 行銷首頁（/）
│   ├── login, register, forgot-password, reset-password, recover-account（找回帳號）
│   ├── terms, privacy, account-suspended
│   ├── onboarding/      # 首次登入 Wizard（三步驟；頁面自行 auth 守衛）
│   └── change-password/ # 已登入用戶主動變更密碼（頁面自行 auth 守衛）
├── (user)/          # 需登入群組
│   ├── layout.tsx   # 登入 + 暫停 + 臨時密碼 + profile completion 守衛 + Topbar
│   ├── dashboard/       # redirect → /user/{id}（舊書籤相容）
│   ├── user/[id]/       # 學員專屬頁面：基本資料 + 本人功能單元
│   ├── user/[id]/courses/ # 我的開課列表（本人專屬，Spirit ID 小寫路由）
│   ├── course-sessions/ # 開課查詢頁（保留，將逐步以 /user/[id]/courses 取代）
│   ├── notifications/   # 通知歷史頁面（分頁，每頁 20 則）
│   ├── course/[id]/     # 課程詳情頁（訪客可達，由 GUEST_PAGES 放行）
│   ├── course/[id]/graduate/  # 課程結業表單頁（填寫→預覽→送出）
│   ├── profile/         # 舊路由相容：server redirect → /user/{spiritId}/profile
│   └── user/[spiritId]/profile/  # 個人資料維護（新路由，含 profile-form.tsx）
├── (admin)/         # 需 admin 身分群組（URL 仍為 /admin/*）
│   ├── layout.tsx   # (user) 守衛 + canAccessAdmin；後台各頁不再自行守衛
│   └── admin/           # 管理後台：功能網格（儀錶板/課程/授課/教材/會員/教會/系統設定）
│       ├── dashboard/       # 後台儀錶板（統計卡片 7 個）
│       ├── course-sessions/ # 開課管理（全站；搜尋 + 篩選；inline 狀態變更）
│       ├── members/         # 會員管理清單（搜尋/篩選/翻頁/重設密碼/查看詳情）
│       ├── members/[id]/    # 會員詳情（Tabs：基本資料/學習階層/講師身分/特殊設定）
│       ├── members/inactive/ # 未啟用會員清單（lastLoginAt 為 null）
│       ├── materials/       # 教材申請管理（查看、確認已寄送、出貨單列印）
│       ├── churches/        # redirect → /admin/settings?tab=churches（舊路由相容）
│       └── settings/        # 系統設定 Tabs（hierarchy_depth/教會/課程目錄）
├── api/auth/        # NextAuth handlers
├── api/ecpay/
│   ├── store-map/       # GET：產生 ECPay MapCVS auto-submit form（Mock 模式支援）
│   └── store-callback/  # POST：接收 ECPay 門市選擇結果，postMessage 回前端後關閉視窗
├── middleware.ts    # 未登入攔截 + 臨時密碼強制導向 + x-pathname header 注入
└── layout.tsx       # Root layout（Toaster）

components/
├── ui/              # shadcn/ui 基礎元件
├── layout/
│   └── topbar.tsx   # 頂部工具列（sticky；回首頁→/user/{spiritId}；後台管理→/admin（admin only）；個人資料→/user/{spiritId}/profile；通知 Drawer）
├── notification/
│   └── notification-drawer.tsx  # 右側通知 Drawer（Sheet，lazy load，標記已讀；SheetHeader pr-10 避免與 X 重疊）
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
│   ├── material-order-table.tsx    # 教材申請管理表格（狀態 Badge、確認已寄送、展開詳情）
│   ├── member-reset-button.tsx     # 重設密碼按鈕（AlertDialog 確認）
│   ├── members-filter.tsx          # 會員管理篩選列（搜尋 debounce 300ms + 性別/身分/教會下拉；更新 URL，改篩選重置 page）
│   ├── members-pagination.tsx      # 會員管理翻頁控制（上一頁/下一頁，?page=）
│   ├── member-delete-button.tsx    # 刪除會員按鈕（AlertDialog 二次確認；ENABLE_MEMBER_DELETE 控制）
│   ├── member-hierarchy-tree.tsx   # 師生傳承樹（Server Component；老師/本人/學生 N 層縮排）
│   ├── hierarchy-depth-form.tsx    # 學習階層深度設定表單（Client；1–10 整數）
│   └── church-list.tsx             # 教會清單管理（Client；CRUD inline，AlertDialog 刪除確認）
├── ecpay-store-selector/
│   └── store-selector.tsx   # ECPay MapCVS 超商門市選擇器（7-11 UNIMART / 全家 FAMI，postMessage 同源）
├── course-session/
│   ├── course-session-dialog.tsx  # 新增開課 Dialog 入口（teachableCatalogIds 逐書資格 gate）
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
├── member/
│   └── member-display-name.tsx  # 顯示名稱元件（薄包裝，呼叫 getMemberDisplayName）
└── learning/
    ├── course-progress-cards.tsx # 學習進度三卡（個人首頁基本資料區塊，含結業時間）
    └── feedback-entry.tsx        # 學習紀錄面板＋學習歷程回饋入口（Client）

lib/
├── auth.ts          # NextAuth 設定（JWT + Google + Credentials）
├── prisma.ts        # Prisma client singleton
├── spirit-id.ts     # Spirit ID 產生器
├── schemas/         # Zod 驗證 schema
├── utils/
│   └── member-display.ts    # getMemberDisplayName(user) 純函式（系統標準：暱稱→中文名稱→英文名稱，三模式括號省略；名稱不含 name/email）
├── data/
│   ├── user.ts              # 使用者資料查詢
│   ├── password-reset.ts    # 密碼重設查詢
│   ├── course-sessions.ts   # 開課記錄查詢（getMyCourseSessions, getMyCourseSessionCount, getCourseSessionById, getMyEnrollments, getMyCompletionCertificates）
│   ├── course-catalog.ts    # 課程目錄查詢（getAllCourses, getActiveCourses, getCourse, checkPrerequisites, getGraduatedCatalogIds）
│   ├── course-order.ts      # 課程訂購查詢（getAllCourseOrdersWithInvite, getCourseOrderForPrint）
│   ├── members.ts           # 會員管理查詢（buildMemberWhere/hasAnyMemberFilter, searchMembers 分頁{total,items,page,pageCount}, getMemberDetail, exportMembers 吃 MemberFilters）
│   ├── hierarchy.ts         # 師生傳承查詢（getMemberHierarchy，BFS，僅限啟動靈人 catalogId=1，graduatedAt IS NOT NULL）
│   ├── admin-settings.ts    # 後台設定查詢（getAdminSetting, upsertAdminSetting）
│   ├── churches.ts          # 教會管理查詢（getActiveChurches, getAllChurches, createChurch, updateChurch, toggleChurchActive, deleteChurch）
│   ├── notification.ts      # 通知查詢（getNotifications, getUnreadNotificationCount, getNotificationsPaginated）
│   └── course-message.ts    # 課程 FAQ 留言查詢（getCourseMessages(inviteId, viewer)：1 對 1 可見性—老師見全部、會員僅見自己的串；提問升序＋回覆內嵌）
├── ecpay/
│   └── logistics.ts         # ECPay 物流工具（calcLogisticsCheckMacValue，MD5，物流 CMV-MD5 規格）
└── utils.ts         # cn() 等工具函數

prisma/
├── schema/
│   ├── base.prisma           # generator + datasource
│   ├── user.prisma           # User, Account, Session, WhitelistedEmail, Notification
│   ├── course-order.prisma   # CourseOrder + enums
│   ├── course-invite.prisma  # CourseInvite + InviteEnrollment
│   ├── course-message.prisma # CourseMessage（課程 FAQ 留言；parentId 自關聯，提問/回覆同表，cascade）
│   ├── course-catalog.prisma # CourseCatalog（id, label, description?, isActive, sortOrder, prerequisites 自關聯）
│   ├── admin-setting.prisma  # AdminSetting（key/value store；hierarchy_depth 預設 3）
│   └── church.prisma         # Church（id, name @unique, isActive, sortOrder）+ ChurchType enum（church|other|none）
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
roles         UserRole[] (多重身分；user 基線 + teacher_1~teacher_3（三個書籍講師）/admin/superadmin，預設 [user])
spiritId      String?（唯一，格式 PA+YY+XXXX）
teacherNo     String?（授課老師編號，如 A001；學員為 null）
passwordHash  String?（Google-only 為 null）
isTempPassword Boolean（臨時密碼強制變更旗標）
commEmail     String?（通訊 Email）
realName      String?
englishName   String?（英文名稱）
nickname      String?（自訂暱稱，最多 20 字）
gender        Gender（male | female | unspecified，預設 unspecified）
birthYear     Int?（出生年，西元 4 位數；onboarding 必填、可於個人資料維護）
displayNameMode DisplayNameMode（nickname | nickname_zh | nickname_en，預設 nickname）
phone         String?
address       String?
createdAt / updatedAt / lastLoginAt / previousLoginAt
```
> `lastLoginAt`／`previousLoginAt`：每次登入成功於 `signIn` callback 以原子 SQL 平移記錄（舊 `lastLoginAt` → `previousLoginAt`，`lastLoginAt` → NOW()），失敗不阻斷登入。會員詳情頁「活躍度」區與 Excel 匯出據此推導「首次登入／首次補填（`realName && phone`）／臨時密碼狀態（`isTempPassword`，無密碼帳號為不適用）」。

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
orders        CourseOrder[]（一對多：一門課可多筆教材訂單）
createdById   String（建立者 UUID）
createdAt     DateTime
cancelledAt   DateTime?（有值代表已取消）
cancelReason  String?（取消原因文字）
completedAt   DateTime?（有值代表已結業）
isPublicMatch Boolean（是否公開媒合，預設 false）
matchNote     String?（公開招募備註，選填）
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
teacherRecommended   Boolean?（講師資格回饋：null=未填、true=推薦、false=不推薦）
teacherFeedbackNote  String?（回饋選填備註）
teacherFeedbackAt    DateTime?（回饋填寫/更新時間）
@@unique([inviteId, userId])
```

### CourseMessage
```
id        Int（主鍵，autoincrement）
inviteId  Int（關聯 CourseInvite，onDelete: Cascade）
authorId  String（作者 UUID）
body      String（留言內容，Text）
parentId  Int?（null = 提問；有值 = 回覆，自關聯 CourseMessageReplies，onDelete: Cascade）
createdAt DateTime
@@index([inviteId])
```
課程 FAQ 留言：任何登入會員可提問（parentId=null），僅授課老師可回覆（parentId 指向提問）。**可見性為 1 對 1**：每則提問串僅發問者本人與授課老師可見（`getCourseMessages` 依 viewer 過濾，老師見全部、其他會員僅見 `authorId === 自己` 的串）。

### Church
```
id        Int（主鍵，autoincrement）
name      String（唯一）
isActive  Boolean（預設 true）
sortOrder Int（預設 0）
users     User[]
```

### User（所屬教會欄位）
```
churchType  ChurchType（church | other | none，預設 none）
churchId    Int?（關聯 Church，onDelete: SetNull）
churchOther String?（churchType = other 時的自填文字）
```

### AdminSetting
```
key   String（主鍵，@unique）
value String（值為字串，應用層轉型）
```
目前使用的鍵：
- `hierarchy_depth`：學習階層展開層數，整數字串，預設 `"3"`，有效範圍 1–10

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
traditionalQty  Int（本筆申請繁體本數；單一地址自動帶尚未申請剩餘、多地址為批次加總）
simplifiedQty   Int（本筆申請簡體本數）
courseInviteId  Int?（一對多：關聯 CourseInvite；獨立訂單為 null）
createdAt       DateTime
```
> 開課門檻（`lib/utils/course-start-gate.ts`）：≥1 已核准學員 + **尚未申請教材需求為 0**（`remaining` 繁/簡皆 0）+ 所有教材訂單 `receivedAt != null`；全班不需教材（總需求 0、無訂單）時後兩項自動成立。`startCourseSession` 與課程詳情頁「開始上課」按鈕共用此判定（server 端以 `getEnrollmentMaterialSummary`＋訂單繁/簡加總重算 remaining），未達門檻按鈕停用並列出原因。
> 教材申請進度（`lib/utils/material-progress.ts`）：總需求＝已核准學員 materialChoice 統計、已申請＝訂單繁/簡加總、尚未申請＝差值；單一地址申請自動帶剩餘全部、多地址手動分配且不可超額；講師操作區為三區塊（教材申請／開始上課／取消上課）。

---

## 5. 關鍵業務邏輯

### 認證流程（多層）
1. **Middleware** — 攔截未登入請求，導向 `/login?callbackUrl=<path>`；注入 `x-pathname` header 供 layout guard 使用
2. **Email 白名單** — Google OAuth callback 驗證 `WhitelistedEmail.isActive`
3. **臨時密碼攔截** — `isTempPassword=true` 強制導向 `/onboarding`（Onboarding Wizard）
4. **Profile Completion Guard** — `(user)/layout.tsx` 讀取 `REQUIRE_PROFILE_COMPLETION` 環境變數（預設 true）；啟用時若 `realName`/`phone` 缺失則導向 `/user/{spiritId}/profile?incomplete=1`；排除 `/profile`、`/onboarding` 路徑
5. **JWT** — 儲存 `id`, `roles`（多重身分陣列）, `spiritId`, `isTempPassword`（30 天）；授權判定一律走 `lib/auth-roles.ts`（`canAccessAdmin`/`canTeachBook`/`canTeachAny`/`isSuperadmin`/`hasRole`）
6. **登入後預設導向** — `/user/{currentUserId}`（學員專屬頁面）

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
- 來源：`User.roles`：`canAccessAdmin(roles)` → 「系統管理員」；書籍講師身分 `teacher_1`~`teacher_3` → 對應「{書名}講師」Badge（可多標籤）
- 講師標籤改由 `roles` 推導（不再以結業證書）；書名對應見 `lib/auth-roles.ts`（`BOOK_LABEL_BY_TEACHER_ROLE`）

### 開課身分驗證（依書籍綁定）
- 講師資格依書籍區分（`teacher_1`=啟動靈人、`teacher_2`=啟動豐盛、`teacher_3`=啟動得勝）；「身分↔書籍」對應集中於 `lib/auth-roles.ts`（`TEACHER_ROLE_BY_CATALOG`/`CATALOG_BY_TEACHER_ROLE`）
- 開課入口：`canTeachAny(roles)`（含任一書籍講師身分或 admin/superadmin）顯示／隱藏
- 逐書授課資格：`canTeachBook(roles, courseCatalogId)`（持有該書講師身分，admin/superadmin 豁免）；開課精靈 Step 1 與 `createCourseSession`/`createInvite` Server Action 皆以此把關，未具資格回傳「須具備{書名}講師身分才能授課」

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
- **外寄信件收件人**：對使用者的外寄信一律以 `resolveContactEmail(user)`（`lib/utils/contact-email.ts`）決定收件地址 —— 優先已驗證通訊 Email（`isCommVerified && commEmail`），否則帳號 `email`；通訊 Email 驗證信本身為例外，仍寄至待驗證地址
- **版本**：`config/version.json` 為唯一來源（patch +1 per `/opsx:apply`）
- **Prisma import**：`@prisma/client`（tsconfig paths 已設定）

---

## 7. 當前挑戰與任務

### 已完成
- `cr-spec-260702-006` — 個人首頁整合學習進度與結業證明：個人首頁 `/user/[spiritId]` 基本資料區塊內固定三張課程進度卡（`components/learning/course-progress-cards.tsx` server 元件，目錄順序靈人→豐盛→得勝；已結業＝完成樣式＋學業完成時間〔每目錄最新 `graduatedAt`〕＋班名/老師小字，未結業＝虛線灰階；公開可見）。**刪除** `/learning` 整頁（不轉導、命中友善 404）、`LevelProgress`、`CompletionCertificateCard`、個人頁「結業證明」區塊與他人視角「學習紀錄預覽」、`learning.*` i18n；本人「學習紀錄」面板（回饋入口）保留、成唯一入口。`learning-feedback.ts` 五處 `revalidatePath('/learning')` 改 `revalidatePath('/[locale]/user/[spiritId]', 'page')`。資料沿用 `getAllCourses`＋`getMyCompletionCertificates`，無 migration
- `cr-spec-260701-008` — 後台機敏資料遮蔽：新增 `components/admin/masked-value.tsx` client 元件（預設固定 `***` 不反映長度、點擊切換明文/再點恢復、空值顯示 `—` 不可點、`<button>` 語意＋IconEye/IconEyeOff＋aria-label 依狀態、明文可選取複製〔選取時不觸發切換〕）；套用於 `/admin/members` 清單 Email 欄、`/admin/members/[id]` 基本資料 Email＋**新增「電話」欄**（`phone` 原已 select、免改資料層）、`/admin/members/inactive` email 欄，逐筆獨立切換、不影響 Email 搜尋。顯示層旁窺防護（管理者本有權檢視，明文仍在 payload）；後台繁體、無 migration
- `cr-spec-260623-003` — 後台儀錶板分區塊統計：`/admin/dashboard` 統計改三區塊——**學員分析**（學員總數、近期活躍學員數＝`lastLoginAt` 7 天內、各教會會員總數＝Top 5／Low 5 圓餅圖 client 元件〔shadcn chart/recharts，`church-distribution-charts.tsx`；≤5 間只顯示 Top 5；其他/未填註記 footer；`--chart-1..5` 換為通過 CVD/對比驗證色盤〕，資料 `groupBy(churchId)` 多到少；另有**會員性別圓餅圖**〔男/女/未設定〕與**各年齡柱狀圖**〔年齡＝當年−`birthYear`、固定七組距、未填註記，`member-demographics-charts.tsx`〕）、**講師分析**（啟動/豐盛/得勝講師＝roles teacher_1/2/3，標籤簡化）、**課程分析**（招募中〔原「開課中」更名〕/進行中/已結業〔補 `cancelledAt: null`〕/**已放棄**〔新增，`cancelledAt` 非空〕，四狀態互斥）。`lib/data/dashboard.ts` `DashboardStats` 擴充；後台維持繁體。無 migration
- `cr-spec-260702-005` — 教材所屬姓名必填與誤植聲明：學員申購對話框（`enrollment-application-dialog`）「書本名字」改名「**教材所屬姓名**」並**必填**（標籤星號；空白送出前端 toast 阻擋＋`applyToCourse` 伺服端拒絕、**移除留空自動帶預設 fallback**，`defaultBookName()` 僅供頁面預帶）；欄位下方新增聲明「若因姓名誤植而要重新申請，需先自行吸收誤植之教材費」；i18n `course.enroll.bookName*` 更新＋新增 `bookNameNote`/`bookNameRequired`（zh-TW/en，zh-CN OpenCC）。無 migration
- `cr-spec-260702-003` — 學習歷程回饋（學員自助回報 + 管理者後台補資料）：新增 `LearningRecordFeedback` 模型（`category` missing_record/wrong_teacher/not_graduated、`teacherName` 文字、`courseCatalogId`、`status` pending/approved/rejected、`resolvedBy*`、`resultInviteId`；migration `add_learning_record_feedback`）。學員於學習紀錄頁入口「是否遺失您的學習歷程？請在這裡回饋」送出回饋（類別／老師名稱／課程目錄／備註，`learningFeedback` i18n）並查看自己狀態；後台 `(admin)/admin/learning-feedback` 逐筆處理——**同意建檔**（選現有老師→建課標題含「（補建）」、`completedAt=2025/09/01`＋學員 `graduatedAt=2025/09/01`）、**更正老師**（`$transaction` 移除後台定位的錯誤報名→於正確老師重建結業）、**更正結業**（既有報名 `graduatedAt=2025/09/01`＋清 `nonGraduateReason`，班未結業補 `completedAt`）、**婉拒**（記錄理由）。老師名稱為自由文字、由管理者選現有教師（`searchTeachersAction`）；冪等僅 pending 可處理；不通知學員。學習紀錄頁另顯示**本人**每門課的結業狀態（已/未結業/進行中，`getMyLearningRecords` 補 `completedAt` 推導），未結業列提供「這有誤？回報」一鍵開啟並預帶課程/老師（僅本人視角、不公開）。個人頁 `/user/{spiritId}` **本人視角**亦內嵌此學習紀錄面板（他人視角維持原結業預覽）。後台首頁新增「**學習歷程回饋**」功能卡（`getPendingFeedbackCount` 待處理數動態副標題）。`app/actions/learning-feedback.ts`＋`lib/data/learning-feedback.ts`
- `cr-spec-260702-001` — 名冊/種子班/啟動靈人結業 seed 資料（無 UI/schema 變更）：修 `build-roster.mjs` 隱藏字元（新增 `cleanName()` 清 `U+2060` 等，教師欄與班級名單同名比對失敗→收容班誤判，修正後 `unmatchedTeacherKeys` 歸零）；新增 `build-prosperity-seed.mjs`→`prosperity-seed.json` 於 seed 建「黃國倫啟動豐盛種子班」（`courseCatalogId=2`，65 位成員疊加 `teacher_2` 並結業，結業日 2026/03/08，比對含 `黃宣志`→B006）；新增 `build-graduation.mjs`→`graduation.json`（解析兩份證書 docx 名單，**不寫入 `CertificateProduction`**）作為啟動靈人結業判定——班上 ≥1 名單學員→課程結業（2025/09/01）、名單內 `graduatedAt`/同班未在名單 `nonGraduateReason=other`、零名單班維持進行中；種子班全員結業（2025/03/08）；姓名比對採精確／OpenCC 簡→繁／確認別名（`李素貞`→`李素真`）。審閱清單 `doc/啟動靈人結業班級清單.md`、`doc/有證書沒有班級資料的學員.md`。冪等沿用種子班哨兵（僅全新 seed 生效）
- `cr-spec-260630-005` — 教材申請 UX 調整：後台移除訂單「編輯」（刪 `material-order-edit-dialog`＋`updateMaterialOrderAdmin`）；前台移除「查看」對話框改**內嵌顯示**訂單資訊（書本數量、取貨方式、收件人·電話、寄送/收件時間；多地址逐地址含學員書本）；新增 `cancelCourseOrder`——老師於回填匯款前（`paymentReportedAt` null）可「取消申請」→ 刪除訂單 cascade 釋放書本 → 重新申請。無 migration
- `cr-spec-260701-006` — 友善 404 頁：新增 `app/[locale]/not-found.tsx`（套 layout/i18n、置中卡片＋「回到首頁」`Link href="/"`）＋ `app/not-found.tsx` 根層備援（自帶最小 html/body、inline style、靜態繁體），取代預設「一片黑」404；新增 `notFound.*` i18n
- `cr-spec-260701-005` — 教材寄送批次書本歸屬（治本）：每筆訂單（含單一地址）記錄其涵蓋書本——單一地址亦建立 `MaterialShipment`＋逐本 `MaterialShipmentItem`（涵蓋建立當下 `getUnassignedBookItems`）；`MaterialShipmentItem` 加 `studentName` 快照（migration `add_shipment_item_student_name`）；後台/列印一律讀「該訂單各批次 items」顯示「學員名（書本名字）· 繁/簡」，單/多地址一致、多筆先後寄送各自歸屬不混淆。取代 004 的 `getCourseBookItems` 顯示推導
- `cr-spec-260701-004` — 單一地址教材訂單書本清單：延續 003，讓單一地址（`shipMode=single`）訂單於後台 `material-order-table` 詳情與出貨單列印顯示書本清單（學員名＋書本名字＋版本），由 `getCourseBookItems(courseInviteId)` 推導掛於 `bookItems`。無 migration（純顯示）
- `cr-spec-260701-003` — 學員書本名字＋教材逐本地址指派：學員申購填「書本名字」（`InviteEnrollment.materialBookName`，預設中文→英文→匿名可編輯）；教材改逐本項目（學員名＋版本，`getCourseBookItems`）；多地址寄送由數量制改「地址優先逐本指派」（`MaterialShipmentItem` 快照 bookName/version，`shipmentItemSchema` enrollmentIds，`applyMaterialOrder` 建 items＋推導 qty＋全指派驗證）；後台 `material-order-table`／列印各地址顯示書本清單。migration `add_material_book_items`。系統未上線、無舊資料，items 為單一真相
- `cr-spec-260701-001` — 管理者可修改班級人數上限：新增系統設定 `class_max_capacity`（`AdminSetting`，預設 7，系統設定→基本設定維護）；開課/編輯課程之 maxCount 上限改讀設定值（共用 zod `.max(7)` 放寬為防呆硬頂 999，實際上限於 server action 依身分驗證）；一般使用者受上限、**管理者可超過**（`createCourseSession`/`updateCourseInfo`）；課程詳情「編輯課程資訊」入口對管理者顯示；開課精靈/編輯對話框 input `max`＋提示（i18n `maxHint` 改 `{max}` 參數）依設定值。無 DB migration
- `cr-spec-260701-002` — 後台推薦講師管理＋儀錶板動態副標題：新增 `/admin/recommendations`，列老師講師推薦（`teacherRecommended=true`，依回饋時間、預設未處理）；狀態推導（已成為講師＝已具 `TEACHER_ROLE_BY_CATALOG` 對應書籍講師身分 > 暫不接受 > 未處理）；暫不接受記錄備註/時間/管理者（`InviteEnrollment.recommendDeferred*`，migration `add_recommend_deferral`）、可取消；每列另開視窗看會員。儀錶板功能卡動態副標題：推薦講師（待處理數）、教材作業（待批價/確認款項/出貨數，共用 `getMaterialOrderStatusKey`）；新增「推薦講師」卡
- `cr-spec-260628-003` — 後台實體證書製作管理：新增 `/admin/certificates`，以「人×階層去重」（來源已結業報名）列出應製作證書；標記已完成製作（記錄製作日期＋製作管理者）、可還原（保留備註）、每張可備註；未完成（預設）/已完成篩選、人名搜尋、每頁 30 筆分頁。新增 `CertificateProduction` 模型（`userId×courseCatalogId` 唯一，migration `add_certificate_production`）＋ `lib/data/certificate.ts`＋`app/actions/certificate.ts`；後台功能格新增「證書製作」入口
- `cr-spec-260623-008` — 結業流程優化：結業表單新增「本次學員整體學習狀況」＝**五星評分（1–5）＋見證**（皆選填，班級層級）；`CourseInvite` 新增 `gradRating`/`gradTestimony`（migration `add_graduation_feedback`）；`graduateCourse` 驗證並與 `completedAt` 同筆寫入；課程詳情「結業資訊」區（管理者＋老師）**有值才顯示**星等與見證；表單字串沿 `course.gradForm` i18n
- `cr-spec-260630-004` — 教材申請管理優化：後台教材申請列表移除「教材版本／數量」欄、新增「課程編號（`#courseInviteId`）」欄；展開詳情單一與多地址皆顯示收件人姓名＋聯絡電話；新增**各收件地址內部備註**（single→`CourseOrder.note`、multiple→各 `MaterialShipment.note`），`updateMaterialAddressNote` server action 儲存、僅後台可見、列印出貨單帶出。migration `add_material_order_notes`（兩個 nullable note 欄，非破壞性）
- `cr-spec-260629-008` — 多語系課程網域（子批 2）：課程頁（course/[id] 詳情/graduate/course-sessions）、course-session 元件（卡片/dialogs/create-course-wizard/enrolled-list）、course-faq、graduation-form、課程詳情互動子元件（apply/match/feedback/pending/copy-link）全面 i18n；新增 course 命名空間（detail/sessions/material/graduate/card/wizard/faq/cancel/editInfo/enroll/apply/match/feedback/pending/copyLink/gradForm…，en 草稿 + zh-CN OpenCC）；ICU 計數。**排除**：material-order-dialog + course-detail-actions（教材訂購/付款）→ 009；course-catalog 後台 CRUD 與 course-status-select（後台）維持繁體；shared course-* schema 驗證訊息不動；course-session-form 為 dead code 未動
- `cr-spec-260629-007` — 多語系會員前台批（子批 1）：未登入流程（login/register/forgot/reset/recover/onboarding 頁與表單）與小型會員頁（notifications/invites/learning/match-board）UI 文案在地化；新增 `account`/`onboarding`/`recover`/`notifications`/`invites`/`learning`/`matchBoard` 命名空間（en 草稿 + zh-CN OpenCC）；server 頁用 `getTranslations`+`generateMetadata`、client 用 `useTranslations`；動態文案用 ICU 參數。course 網域留 008、terms/privacy 法律長文與後台維持繁體
- `cr-spec-260629-006` — 多語系第二階段（共用基礎批）：擴充訊息命名空間（common/nav/validation/status/role）；Zod 驗證訊息 key 化（`auth`/`profile` schema → `validation.*`），新增共用 `<FieldError>`（i18n）並遷移 8 個前台表單（login/register/forgot/reset/change-password/change-password-card/profile/onboarding）的錯誤呈現與 toast；課程狀態徽章 `course-status-badge` 改 i18n（`status` 命名空間，轉 client）；Topbar 導覽/品牌字串改 `nav`/`common`；保留 `ROLE_LABELS` map 供匯出；CLAUDE.md 第 12 條補驗證/標籤子規範。後台與信件維持繁體；其餘字串續漸進遷移
- `cr-spec-260629-005` — 對外網址建構收斂：新增 `lib/utils/app-url.ts`（`getAppUrl()` 讀 NEXTAUTH_URL 給寄信用、`getRequestBaseUrl(req)` 依 forwarded-host 給 route handler 導向用）；收斂 5 處（profile/auth/course-invite 寄信連結 + verify-email/suspended-logout 導向）；CLAUDE.md 第 13 條明訂「route handler 禁用 req.url 建對外網址」（dev tunnel 會取到 localhost）
- `cr-spec-260629-004` — 多語系導入（基礎建設 + 範例切片）：導入 next-intl（`i18n/routing|request|navigation.ts`、`next-intl/plugin`），語言 zh-TW（預設無前綴）/ en / zh-CN（path-prefix as-needed）；頁面路由整批移至 `app/[locale]/`，`<html lang>` 由 `app/[locale]/layout.tsx` 提供（移除 `app/layout.tsx`）；middleware 改為 next-intl + 認證組合（沿用 `route-access`/`stripLocale`，補 x-pathname）；`messages/zh-TW.json`（來源）+ `en.json` + `zh-CN.json`（OpenCC 自動產生，`scripts/gen-zh-cn.mjs` + `gen:zh-cn`/`prebuild`）；缺 key 逐層回退繁體；新增語言切換器；範例切片＝登入頁（client `useTranslations` + server `getTranslations` metadata）+ Topbar；慣例寫入 CLAUDE.md 第 12 條。其餘 ~1,400 行字串依慣例漸進遷移
- `cr-spec-260629-003` — Middleware/路由存取架構重構：新增 `lib/auth/route-access.ts` 單一事實來源（`PUBLIC_PAGES`/`PUBLIC_APIS`/`GUEST_PAGES` + `isPublicRoute`/`isGuestRoute`/`stripLocale`，Edge-safe），middleware 與 `(user)/layout` 共用；移除 `lib/utils/guest-paths.ts`；補 `/api/verify-email` 為公開；依權限層級重組 route group（URL 不變）：`(guest)`（首頁/登入/註冊/找回/terms/privacy/onboarding/change-password/account-suspended）、`(user)`、新增 `(admin)`（`(admin)/layout.tsx` 統一 `canAccessAdmin` 守衛，移除 8 後台頁重複守衛）；慣例寫入 `CLAUDE.md` 第 11 條
- `cr-spec-260629-002` — 找回帳號（灌檔/未登入會員自助）：公開 `/recover-account` 流程——中文名字查未啟用帳號（`lastLoginAt=null` 且 `isTempPassword`）→ 課程選擇題驗證身分（老師/同學，正解取自 `InviteEnrollment`，誘答取無關會員，4 選 1、限 3 次，HMAC 簽章 token 跨步驟防竄改）→ 確認/修改 email（唯一性檢查）→ `$transaction` 更新 email + 重產臨時密碼 + 白名單 upsert → `sendTempPasswordEmail`；首頁/登入頁加入口；後台 `/admin/members/inactive` 列出未登入過會員；同名多筆/查無/無題料一律導向管理員；新增 `lib/data/account-recovery.ts`、`lib/utils/recovery-token.ts`、`app/actions/account-recovery.ts`；無 DB schema 變更
- `cr-spec-260629-001` — 首次登入新增必填會員資訊：`User` 新增 `birthYear Int?`（西元年，migration `add_user_birth_year`）；onboarding Step 2 改用 react-hook-form + `onboardingProfileSchema`，新增性別／出生年／所屬教會三項必填（性別須男/女、教會須清單或其他、出生年 1900~當年）；`completeOnboardingProfile` 一併寫入；個人資料頁新增出生年維護（`updateProfileSchema` 加 `birthYear`、可空）；放行條件維持 `realName && phone` 不強制既有會員回填
- `cr-spec-260628-007` — 結業資訊權限收斂：課程詳情頁「結業資訊」區塊顯示條件加入身分判定（`canTeachAny`），改為僅管理者（admin/superadmin）與講師（teacher_1~3）可見，一般會員/已報名學員不再顯示（純前端條件、無資料模型/路由變更）
- `cr-spec-260623-004` — lint 基線修正：`CourseSessionForm` dev 預設日期改以 lazy `useState` 初始化器於 mount 計算一次，移除 render 期間 `Date.now()` 呼叫，消除 `react-hooks/purity` 2 errors（行為不變、無資料模型/路由變更）
- `cr-spec-260622-002` — 會員活躍度追蹤：`User` 新增 `previousLoginAt`（migration `add_previous_login_at`）；`lib/auth.ts` `signIn` callback 於登入成功時以原子 SQL 平移登入時間（try/catch 不阻斷）；`getMemberDetail`／`exportMembers` 補 `previousLoginAt`/`isTempPassword`/`hasPassword`（由 `passwordHash` 推導布林、不外流雜湊）；會員詳情頁新增「活躍度」區（最後/上次登入、首次登入、首次補填、臨時密碼狀態），Excel 匯出補對應四欄
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

- `cr-spec-260401-003` — 會員管理增強：`/admin/members` 搜尋欄（?q= URL param，debounce 300ms）；新增 `/admin/members/[id]` 詳情頁（基本資料、學習紀錄 `inviteEnrollments startedAt IS NOT NULL`、授課紀錄 `courseInvites startedAt IS NOT NULL`）；`ENABLE_MEMBER_DELETE=true` 條件式刪除功能（AlertDialog 二次確認）
- `cr-spec-260402-004` — Cloudflare Tunnel 整合：`cloudflared` 加入 docker-compose.dev.yml（--protocol http2，內部 http://web:3000），隧道文件 `tunnel.md`
- `cr-spec-260402-005` — 服務條款 `/terms` 與隱私政策 `/privacy` 公開靜態頁面
- `cr-spec-260402-006` — 品牌更名 + 首頁改版：`啟動靈人系統`→`啟動事工`；課程 `啟動靈人 1`→`啟動靈人`、`啟動靈人 2`→`啟動豐盛`；首頁改為公開 Landing Page（未登入可瀏覽功能介紹）
- `cr-spec-260402-007` — 修正 admin JWT role 即時同步：JWT callback `else if (token.id)` 分支於每次請求從 DB 同步 role/spiritId/isTempPassword，防止管理員 role 變更後需重新登入
- `cr-spec-260402-008` — 修正 Google OAuth spiritId 衝突：seed 建立學員後同步 `spiritIdCounter`；JWT callback 以帶重試的 `updateMany WHERE spiritId IS NULL` 避免 race condition
- `cr-spec-260402-009` — 會員學習階層：`AdminSetting` 模型（key/value store）；`getMemberHierarchy` BFS 查詢（僅啟動靈人，`graduatedAt IS NOT NULL`，上 1 層老師 + 下 N 層學生）；`MemberHierarchyTree` Server Component；會員詳情頁改為 Tabs（基本資料/學習階層）；`/admin/settings` superadmin 設定頁（hierarchy_depth 1–10）；後台首頁新增「系統設定」卡片（superadmin only）

- `cr-spec-260402-010` — 所屬教會管理：`Church` model + `ChurchType` enum；後台 `/admin/churches` CRUD（停用保留關聯，有關聯時拒絕刪除）；`User` 新增 `churchType/churchId/churchOther`；個人資料頁教會下拉（清單/其他自填/無）；會員詳情頁補顯示所屬教會；seed 預設四個教會（101、心欣、Kua、全福會）
- `cr-spec-260402-011` — 會員 Profile 增強：`User` 新增 `englishName`/`gender`/`displayNameMode`；`getMemberDisplayName()` 純函式（括號省略規則：匿名==真名時僅顯示一次）；`MemberDisplayName` 元件；個人資料頁新增英文名稱/性別/顯示名稱偏好欄位 + 即時預覽；管理員會員詳情頁顯示英文名稱/性別/顯示名稱；全站會員名稱統一改用 `getMemberDisplayName()`；管理員 email 改為 `101@iwillshare.org.tw`；seed 擴充為 20 位指定學員
- `cr-spec-260402-012` — 申請教材簡化：表單精簡為統一編號（選填）+ 取貨方式；`applyMaterialOrder` 自動快照 buyerNameZh/En/teacherName/churchOrg/email/phone/courseDate；後台 `/admin/materials` 展開詳情新增「編輯」按鈕 + `MaterialOrderEditDialog`；新增 `updateMaterialOrderAdmin` Server Action
- `cr-spec-260402-013` — Seed 補充課程與結業資料：`prisma/seed.ts` 新增冪等 guard（adminInviteCount === 0）；建立兩筆示範 CourseInvite（啟動靈人 catalogId=1、啟動豐盛 catalogId=2）；為黃國倫建立兩筆 InviteEnrollment（status=approved，graduatedAt=2026-04-02），使其具備 canTeach=true 授課資格
- `cr-spec-260402-014` — Topbar 導覽按鈕 + 個人資料路由遷移：Topbar 新增「回首頁」（→ `/user/{spiritId}`）與「後台管理」（→ `/admin`，admin/superadmin only）按鈕；通知 Drawer SheetHeader 加 `pr-10` 修正與 X 按鈕重疊；個人資料路由從 `/profile` 遷移至 `/user/{spiritId}/profile`（舊路由 server redirect 相容）；`/change-password` 密碼更新後導向 `/user/{spiritId}/profile`
- `cr-spec-260403-001` — 系統設定 Tabs 整合：`/admin/settings` 改為 Tabs 佈局（「基本設定」：hierarchy_depth superadmin only；「教會代碼維護」：原 `/admin/churches` 內容 admin+）；`/admin/churches` 改為 redirect；後台首頁教會管理卡片連結更新至 `/admin/settings?tab=churches`；tab 以 URL `?tab=` 參數切換
- `cr-spec-260403-003` — 後台開課管理：新增 `/admin/course-sessions` 全站開課列表（admin+）；文字搜尋（課程名稱/講師/學員）+ 下拉篩選（課程名稱/進度/日期區間）；顯示總筆數，前 30 筆；點擊另開視窗；`CourseSessionCard` 新增 `newTab` prop；`getAllCourseSessionsAdmin()` data layer
- `cr-spec-260403-004` — 課程目錄管理整合至系統設定：`/admin/settings` Tabs 新增「課程目錄管理」第三分頁（`?tab=courses`）；`/admin/course-catalog` 改為 redirect；後台首頁移除課程管理卡片
- `cr-spec-260403-005` — 後台儀錶板：新增 `/admin/dashboard`；統計卡片（總學員數/啟動靈人講師數/啟動豐盛講師數/進行中課程數）；開始上課 + 順利結業 BarChart（recharts，依課程類別分組，時間區間 3m/30d/7d 切換）；後台首頁儀錶板卡片啟用

- `cr-spec-260407-001` — 測試腳本文件：新增 `doc/test-script.md`，覆蓋牧師開課、種子講師結業、學員報名、忘記密碼四個測試場景
- `cr-spec-260407-002` — 課程詳情頁 UI 優化：結業按鈕改為進行中才顯示、分享按鈕移至右上角、課程狀態 Badge 完整實作（共用元件 `CourseStatusBadge`/`CourseCatalogBadge`）、課程詳情頁滿版（移除 `max-w-3xl`）
- `cr-spec-260407-003` — 註冊成功 Dialog：Email 註冊成功後以 Dialog 提示（不可關閉），「返回首頁」導向 `/`
- `cr-spec-260407-004` — 變更密碼功能：`/change-password` 改為兩欄品牌版型 + 眼睛 icon；Profile 頁新增 `ChangePasswordCard`（`changePassword` action 不修改 `isTempPassword`）
- `cr-spec-260407-005` — 忘記密碼 UI 改寫：`/forgot-password` 與 `/reset-password` 改為兩欄品牌版型；登入頁新增「忘記密碼？」連結；密碼欄新增眼睛 icon 明碼切換
- `cr-spec-260407-006` — Profile 完整度強制轉導：`REQUIRE_PROFILE_COMPLETION` 環境變數（預設 true）；`(user)/layout.tsx` 新增 guard（middleware 注入 `x-pathname`）；Profile 頁偵測 `?incomplete=1` 顯示強調提示；Dashboard ProfileBanner 改為 env=false 時才顯示

- `cr-spec-260407-007` — Onboarding Wizard：首次登入三步驟 Wizard（`/onboarding`）；Step1 設定密碼（`changeTempPassword`）→ Step2 填基本資料（`completeOnboardingProfile`）→ Step3 歡迎畫面（顯示靈人編號）；middleware 攔截目標改為 `/onboarding`；`completeOnboardingProfile` 新增 action

- `cr-spec-260408-004` — 啟動編號改名 + 會員管理：spiritId 顯示統一為「啟動編號」；會員管理頁支援啟動編號搜尋、列表依加入日期/姓名排序
- `cr-spec-260408-005` — 會員 Excel 匯出：`/api/admin/members/export` Route Handler（依 `?q=` 篩選或全部，非 admin 回 401）；會員管理頁「匯出 N 筆／匯出全部」按鈕；13 欄欄位定義（性別/角色/教會中文化）
- `cr-spec-260604-001` — 多個教材寄送地址：新增 `ShipMode` enum、`CourseOrder.shipMode`、`MaterialShipment` 寄送批次 model；教材申請可選單一/多地址，多地址依繁/簡本數分配至全部完成；`applyMaterialOrder` 接收 `shipMode`/`shipments` 並權威驗證本數總和；新增 `confirmShipmentBatch`（全部批次寄完自動設 `CourseOrder.shippedAt`）；後台逐批次確認、出貨單列印每批次一份；單一地址流程與講師收件不變
- `cr-spec-260604-002` — 新增測試授課（僅測試環境）：使用者頁「新增授課」旁新增「新增測試授課」按鈕（`NODE_ENV=development` 才顯示）；`createTestCourseSession` action 一鍵建立啟動靈人 `CourseInvite`（待開課）+ 5 位動態臨時測試 `User` + 5 筆 approved 報名，不建 `CourseOrder`；action 內含 production 守衛
- `cr-spec-260604-005` — 後台會員管理優化與多重身分：`User.role` 改為 `roles UserRole[]`（新增 `teacher`，身分 user/teacher/admin/superadmin 可並存，user 為基線）；新增 `lib/auth-roles.ts` 集中授權判定（`canAccessAdmin`/`canTeach`/`isSuperadmin`/`hasRole`/`normalizeRoles`），全站守衛改走 helper；JWT/session 由 `role` 改 `roles`；後台「新增會員」（`createMember`：核發 spiritId + 臨時密碼 + 白名單，顯示一次）；詳情頁多重身分編輯（`updateMemberRoles`，禁止移除自身 admin/superadmin）；`resetMemberPassword` 重設後重新顯示臨時密碼；會員列表移除「加入日期」改顯示「身分」badge、匯出身分欄輸出全部；開課（`createCourseSession`/`createInvite`）加 `canTeach` 前置；migration `add_user_multi_roles` backfill 既有 role
- `cr-spec-260605-001` — 名冊 seed：`User` 新增 `teacherNo`（授課老師編號，migration `add_user_teacher_no`）；以 `doc/啟動事工資料表_updated.xlsx` 經產生器 `prisma/seed-data/build-roster.mjs` 產出 `roster.json`（執行期不讀 xlsx）；重寫 `prisma/seed.ts` 保留 admin + 黃國倫，其餘人員（教師 [user,teacher]+真實 Email、學員 [user]+合成 Email `{spiritId}@seed.iwillshare.org.tw`）以姓名去重建立；每個非空班級欄一筆 `CourseInvite`（掛啟動靈人 catalog 1）+ approved 報名；對應不到的教師歸黃國倫收容課程；教會正規化為 10 間；`teacherNo` 顯示於會員詳情頁與 Excel 匯出；冪等守衛（收容班哨兵）
- `cr-spec-260604-003` — 媒合功能：`CourseInvite` 新增 `isPublicMatch`（預設 false）/`matchNote`（migration `add_course_public_match`）；開課精靈基本資料步驟新增「公開媒合」開關（預設關）+ 招募備註（上限 500）；課程詳情頁講師可切換公開媒合／編輯備註（`updateMatchSettings`，僅講師或管理者，關閉保留 matchNote）；新增媒合布告欄頁面 `/match-board`（所有登入會員，列出公開＋未取消＋未結業＋未過截止日課程，`getPublicMatchingSessions()`）；`CourseSessionCard` 加 `matchNote`/`showMatchBadge`（公開媒合・招募中 badge + 備註）；Topbar 右上角新增「媒合布告欄」入口
- `cr-spec-260628-004` — 招生階段編輯課程資訊：新增 `updateCourseInfo` action（擁有者/管理者 + 招生中守衛；可改名稱/人數/截止日/開課日/備註，不含書本）；課程詳情頁新增 `EditCourseInfoDialog`（招生中＋擁有者才顯示）；`maxCount` 規則 1–7（每班最多 7 人）並同步套用建立路徑（`courseSessionSchema`/`createInviteSchema`/`create-invite-form`/開課精靈 step-2），編輯時 `maxCount` 不得低於已核准學員數（server 端驗證）；`getCourseSessionById` 補回傳 `notes`；新 capability `course-info-edit`、修改 `create-course-session`；無 DB schema 變更
- `cr-spec-260628-006` — 開課門檻納入「尚未申請=0」：修正教材收件後新增選書學員仍可開課的 BUG；`evaluateCourseStartGate` 改以 `remaining`（尚未申請繁/簡）判定並移除「至少一筆訂單」硬擋（有需求未申請由 remaining 擋、全班不需教材則可開課）；`page.tsx` 傳入 `materialProgress.remaining`、`startCourseSession` 以當下資料重算 remaining 後驗證；修改 capability `course-status`
- `cr-spec-260628-005` — 多筆教材申請優化：`CourseOrder` 新增 `traditionalQty`/`simplifiedQty`（migration `add_course_order_book_qty`，多地址既有訂單由 shipments 回填）；新增 `lib/utils/material-progress.ts`（總需求／已申請／尚未申請）；`applyMaterialOrder` 單一地址自動帶剩餘全部、多地址各批次加總且不可超過剩餘（server 以當下 DB 重算驗證）；講師操作區 `course-detail-actions.tsx` 重整為三區塊（教材申請／開始上課／取消上課），教材區顯示申請進度與每筆訂單繁/簡數量，「申請教材」按鈕僅在尚未申請>0 可按；`material-order-dialog` 單一地址唯讀顯示自動帶入數量、多地址改以剩餘量為上限（不再要求全數分配）；後台 `material-order-table`／出貨單列印頁顯示每筆訂單繁/簡本數；修改 capability `course-multi-material-order`
- `cr-spec-260628-002` — 教材多筆訂單＋開課門檻：`CourseInvite`↔`CourseOrder` 由一對一翻轉為**一對多**（`CourseOrder.courseInviteId`，migration `multi_material_order` 含資料回填）；`applyMaterialOrder` 改為每次建立新訂單、`reportMaterialPayment`/`confirmReceipt` 改以 `orderId` 操作；多地址放寬「總和=課程總計」改為各訂單自填（≥1 本）；課程詳情頁教材區塊改逐筆訂單清單＋「再申請一筆教材」、既有訂單唯讀；新增 `lib/utils/course-start-gate.ts` 開課門檻判定（≥1 已核准學員 + 教材全部收件），「開始上課」按鈕招生中常駐顯示、未達門檻停用並列出原因，`startCourseSession` server 端同步驗證；新增 capability `course-multi-material-order`、修改 `course-status`
- `cr-spec-260628-001` — 課程 FAQ 改 1 對 1 可見性：FAQ 留言由「課程內公開」改為每則提問串僅發問者本人與授課老師可見；`getCourseMessages` 新增 `viewer` 參數（老師見全部、其他會員 `where.authorId` 僅見自己的串），`/course/[id]` 傳入 `currentUserId`/`isInstructor`；`CourseFaq` 空狀態文案改為依身分顯示；提問／回覆／刪除權限與 Inbox 通知不變；無 DB schema 變更
- `cr-spec-260611-002` — 課程 FAQ：新增 `CourseMessage` model（提問與回覆同表，`parentId` 自關聯，`invite`/`parent` 皆 `onDelete: Cascade`；migration `add_course_message`）；課程詳情頁底部新增「課程 FAQ」留言區（`CourseFaq` client 元件）；`postCourseQuestion`（任何登入會員提問，通知老師）／`replyCourseMessage`（僅授課老師回覆，通知發問者）／`deleteCourseMessage`（作者本人或授課老師可刪，刪提問 cascade 刪回覆，不發通知）三個 action；`getCourseMessages` data layer；`lib/schemas/course-message.ts`（1–2000 字）；雙向 Inbox 通知
- `cr-spec-260611-004` — Seed 資料優化：重寫 `prisma/seed.ts` 課程／報名邏輯（資料源 `roster.json` 不變）——凡報名學員本身為老師則該報名設 `graduatedAt`（啟動靈人結業證書，全教師覆蓋）；整班皆老師的課程設 `completedAt`（已結業，含收容班）；所有報名 `materialChoice='traditional'`（繁體）；黃國倫補一筆啟動靈人結業報名維持開課資格；新 capability `seed-roster-data`，退場過時的 `seed-course-completions`；無 DB schema 變更。實測：232 位教師全數取得證書、5 門全教師班結業、報名全繁體
- `cr-spec-260611-001` — 儀錶板優化：後台儀錶板統計卡片由 4 張改為 6 張（總會員數／啟動靈人講師資格人數／啟動豐盛講師資格人數／開課中課程總數／進行中課程總數／已結業課程總數）；講師資格人數重新定義為「`teacher` 身分 AND 結業該課程」（admin/superadmin 未加掛 teacher 不計入）；移除課程活動統計圖表（上課人次/順利結業 BarChart、`?range=` 時間區間切換），刪除 `dashboard-charts.tsx` 與 `getCourseStartStats`/`getGraduationStats`/`CourseStatItem`；無 DB schema 變更
- `cr-spec-260611-003` — 後台變更課程狀態：開課管理 `/admin/course-sessions` 每筆課程卡片下方新增 inline 狀態下拉（`CourseStatusSelect`），管理者可直接變更狀態（招生中／進行中／已取消，自由任意轉換）；新增 `setCourseStatusAdmin` action（`canAccessAdmin` 守衛，依目標清/設 startedAt/cancelledAt/completedAt 旗標，不發通知）；不提供設「已結業」（結業仍由講師走逐學員結業頁，已結業課程下拉停用）；狀態篩選功能本已存在；無 DB schema 變更

- `cr-spec-260612-001` — 會員管理效能優化：`/admin/members` 未下任何條件時不查詢／不列清單（提示輸入搜尋或篩選）；有條件時每頁 30 筆 + 上一頁／下一頁翻頁（`?page=`，越界夾範圍）；新增性別／身分（`roles.has`，包含語意）／所屬教會（churchId/other/none）下拉篩選，與文字搜尋 AND 組合（改篩選重置 page）；`searchMembers(f,page)→{total,items,page,pageCount}`、抽出 `buildMemberWhere`/`hasAnyMemberFilter`；匯出尊重全部篩選（「匯出 N 筆」=符合條件總數）、export route 吃 `gender/role/church`；新增 `MembersFilter`/`MembersPagination` 元件、移除舊 `MemberSearchInput`；無 DB schema 變更

- `cr-spec-260620-001` — 講師資格依書籍區分：`UserRole` 由單一 `teacher` 拆為四個書籍講師身分 `teacher_1`~`teacher_4`（migration `split_teacher_roles_by_book`，重建 enum）；`lib/auth-roles.ts` 新增「身分↔書籍」對應（`TEACHER_ROLE_BY_CATALOG`/`CATALOG_BY_TEACHER_ROLE`/`BOOK_LABEL_BY_TEACHER_ROLE`）與 `canTeachBook(roles,catalogId)`/`canTeachAny(roles)`，取代布林 `canTeach`；開課（`createInvite`/`createCourseSession`）改 `canTeachBook` 逐書把關、解除「結業=授課資格」耦合；開課精靈 Step 1 由 `graduatedCatalogIds` 改 `teachableCatalogIds`（提示「須具備{書名}講師身分才能授課」）；身分標籤、`/admin/members` 身分篩選與身分編輯改為四個書籍講師身分；儀錶板講師資格人數改以 `roles.has('teacher_N')` 計數並擴為四本書（8 張卡片）；書籍改名：啟動靈人 3→啟動得勝、啟動靈人 4→啟動事工 4；seed 新增測試講師 `teacher@test.com`（四書講師身分）、roster `teacher`→`teacher_1`

- `cr-spec-260620-002` — 講師資格回饋單：`InviteEnrollment` 新增 `teacherRecommended Boolean?`/`teacherFeedbackNote`/`teacherFeedbackAt`（migration `add_instructor_feedback`）；新增 `upsertInstructorFeedback` action（守衛 `invite.createdById===當前使用者` 且 `graduatedAt!=null`，可重複覆蓋）；課程詳情頁「結業資訊」已結業學員旁新增「填寫講師資格回饋」（`InstructorFeedbackButton`，是/否 + 選填備註，僅課程建立者可見）；`/admin/members/[id]` 學習紀錄新增「講師資格回饋」欄（以 `BOOK_LABEL_BY_TEACHER_ROLE` 組「推薦成為{書名}講師」+ 備註 + 推薦老師），回饋為參考、不自動授予身分；`getCourseSessionById`/`getMemberDetail` 補回饋欄位 select

- `cr-spec-260620-003` — 顯示名稱統一（系統標準/資安）：`DisplayNameMode` enum 由 `chinese`/`english` 改為 `nickname`(預設)/`nickname_zh`/`nickname_en`（migration `display_name_modes`，重建 enum、既有 chinese→nickname_zh、english→nickname_en）；重寫 `getMemberDisplayName`（基底 暱稱→中文名稱→英文名稱、模式加註括號、空或同基底省略、全空「（未填）」、名稱不含 `name`/`email`）；`MemberDisplayName` 型別更新；個人資料「顯示名稱方式」三選項、文案「匿名」改「暱稱」、`lib/schemas/profile.ts` enum 更新；全站人名顯示一律改用 `getMemberDisplayName`（課程詳情/結業/待審/邀請/學習紀錄/後台會員與師生樹/儀錶板），移除 `name ?? email`、`realName ?? name` 拼接，Email 作聯繫用途保留；相關資料層 select 補 `realName`/`englishName`/`nickname`/`displayNameMode`

### 進行中 / 待規劃
- （無）

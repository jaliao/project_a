# 3. 系統架構

> 屬於 [README-AI.md](../README-AI.md) 拆分章節，回索引請見該檔。

```
app/
# i18n：頁面路由全部位於 app/[locale]/ 之下（next-intl，zh-TW 預設無前綴 / en / zh-CN）；
#       <html lang> 由 app/[locale]/layout.tsx 提供（已無 app/layout.tsx）；api/ 不在地化
# 路由依「權限層級」分組（route group () 不影響 URL），各 group layout 即守衛；
# 免登入頁面/API 的單一事實來源為 lib/auth/route-access.ts（middleware 與 layout 共用）
├── [locale]/        # i18n 根：層下含 (guest)/(user)/(admin) 三群組
├── (guest)/         # 免登入群組（薄 passthrough layout，不擋已登入者）
│   ├── page.tsx         # 行銷首頁（/）——含 Organization/WebSite JSON-LD
│   ├── courses/         # 課程介紹頁（/courses，SEO 公開頁；資料驅動自 CourseCatalog + Course JSON-LD）
│   ├── login, register, forgot-password, reset-password, recover-account（找回帳號）
│   ├── terms, privacy, account-suspended
│   ├── onboarding/      # 首次登入 Wizard（三步驟；頁面自行 auth 守衛）
│   └── change-password/ # 已登入用戶主動變更密碼（頁面自行 auth 守衛）
├── (user)/          # 需登入群組
│   ├── layout.tsx   # 登入 + 暫停 + 臨時密碼 + profile completion 守衛 + Topbar
│   ├── dashboard/       # redirect → /user/{id}（舊書籤相容）
│   ├── user/[id]/       # 學員專屬頁面：基本資料 + 本人功能單元
│   ├── user/[id]/courses/ # 我的開課列表（本人專屬，Spirit ID 小寫路由）
│   ├── notifications/   # 通知歷史頁面（分頁，每頁 20 則）
│   ├── course/[id]/     # 課程詳情頁（訪客可達，由 GUEST_PAGES 放行；管理者/該課講師可於「已核准學員」區塊增刪學員、操作重新招募/結業/取消作業、檢視課程操作 LOG）
│   ├── course/[id]/graduate/  # 課程結業表單頁（填寫→預覽→送出）
│   ├── profile/         # 舊路由相容：server redirect → /user/{spiritId}/profile
│   └── user/[spiritId]/profile/  # 個人資料維護（新路由，含 profile-form.tsx）
├── (admin)/         # 需 admin 身分群組（URL 仍為 /admin/*）
│   ├── layout.tsx   # (user) 守衛 + canAccessAdmin；後台各頁不再自行守衛
│   └── admin/           # 管理後台：功能網格（儀錶板/課程/授課/教材/會員/教會/系統設定）
│       ├── dashboard/       # 後台儀錶板（統計卡片 7 個）
│       ├── course-sessions/ # 開課管理（全站；搜尋 + 篩選；純卡片列表——學員增刪/狀態/LOG 皆於前台課程頁操作）
│       ├── members/         # 會員管理清單（搜尋/篩選/翻頁/重設密碼/查看詳情/會員首頁〔新分頁開該會員 /user/<spiritId>〕）
│       ├── members/[id]/    # 會員詳情（Tabs：基本資料/學習階層/講師身分/特殊設定；頁首含「會員首頁」按鈕）
│       ├── members/inactive/ # 未啟用會員清單（lastLoginAt 為 null；有 spiritId 者亦提供「會員首頁」）
│       ├── materials/       # 教材申請管理（查看、確認已寄送、出貨單列印）
│       ├── churches/        # redirect → /admin/settings?tab=churches（舊路由相容）
│       └── settings/        # 系統設定 Tabs（hierarchy_depth/教會/課程目錄）
├── api/auth/        # NextAuth handlers
├── api/ecpay/
│   ├── store-map/       # GET：產生 ECPay MapCVS auto-submit form（Mock 模式支援）
│   └── store-callback/  # POST：接收 ECPay 門市選擇結果，postMessage 回前端後關閉視窗
├── robots.ts        # /robots.txt（SEO：allow /、disallow 後台/功能區塊、宣告 sitemap，網域取自 lib/utils/site-url.ts）
├── sitemap.ts       # /sitemap.xml（SEO：/, /courses, /terms, /privacy, /pwa-install + hreflang alternates）
├── middleware.ts    # 未登入攔截 + 臨時密碼強制導向 + x-pathname header 注入（matcher 排除 robots.txt/sitemap.xml）
└── layout.tsx       # Root layout（Toaster）；[locale]/layout.tsx generateMetadata 提供 metadataBase/OpenGraph/canonical/hreflang

components/
├── ui/              # shadcn/ui 基礎元件
├── layout/
│   └── topbar.tsx   # 頂部工具列（sticky；左側 Logo 可點回首頁＋truncate；桌機平鋪按鈕群 hidden md:flex；手機 <md 收合為「選單」Sheet（side=right）＋未讀 Badge；回首頁→/user/{spiritId}；媒合布告欄→/match-board；我的學習→/user/{spiritId}/learning；後台管理→/admin（admin only）；個人資料→/user/{spiritId}/profile；通知 Drawer 共用）
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
│   ├── member-home-link.tsx        # 「會員首頁」按鈕（next/link + target=_blank 開 /user/<spiritId 小寫>；無 spiritId 則 disabled；三處後台會員清單/詳情共用）
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
│   ├── material-order-dialog.tsx  # 教材申請 Dialog（逐本清單編輯：改版本/取消勾選/加購；EcpayStoreSelector（7-11/全家）、已寄送唯讀模式）
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
├── member-creation.ts # 建立可登入會員共用邏輯（spiritId＋臨時密碼＋白名單；createMember 與班級新增學員共用，可於 tx 內呼叫）
├── account-email-change.ts # 登入帳號 email 變更共用邏輯（正規化＋唯一性＋交易三步：改 email/停用舊白名單/新白名單啟用；本人與管理者 action 共用）
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
│   ├── invite-students.ts   # findMemberByEmail：email 查既有會員（課程頁新增學員確認列用）
│   ├── admin-logs.ts        # 管理操作紀錄查詢（getAdminLogs：最新在前、每頁 30 筆、inviteId 過濾；只讀快照欄不 join；供課程頁 LOG 區塊）
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
│   ├── admin-log.prisma      # AdminActionLog（管理操作紀錄；optional FK SetNull＋文字快照欄）
│   └── church.prisma         # Church（id, name @unique, isActive, sortOrder）+ ChurchType enum（church|other|none）
└── seed.ts

config/
├── version.json          # 版本號（SemVer 唯一來源）
├── admin-log-action.ts   # 操作紀錄動作常數（enrollment_add/enrollment_remove＋標籤）
└── project-status.ts, project-type.ts
```

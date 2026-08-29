## Context

**個人首頁** `app/[locale]/(user)/user/[spiritId]/page.tsx`（server component，376 行）現況：

- 外層 `<div className="space-y-6">`，內含（依序）：banners → `<h1>首頁</h1>` → 5 個區塊，每個區塊為 `<div className="rounded-lg border p-5 space-y-4">`：
  1. **基本資料**：`IconUser` + 標題；姓名 / 啟動編號 / 身分標籤 field rows；**學習進度三卡**（`<CourseProgressCards>` → `grid sm:grid-cols-3`，每卡 `rounded-md border px-3 py-2.5`）。
  2. **課程**：`IconBook` + 標題；`<CourseCardGrid>` 內 `<CourseSessionCard variant="compact">`（本身帶 `rounded-lg border`）。
  3. **我的學習**（`isOwnPage` 才顯示）：`rounded-lg border p-5` 內一個 `<Link href="/user/{id}/learning">`（`IconNotebook` + `<h2>我的學習</h2>` + `IconChevronRight`）。**整個區塊只是一個連結**。
  4. **聯繫管理者**（`isOwnPageEarly` 才顯示）：標題列 `<Link href="/user/{id}/inquiries">`（`IconMessageCircle` + `<h2>` + chevron）＋ `<ContactAdminCards inquiries={myRecentInquiries}>`（`grid sm:grid-cols-3`，每格 `rounded-lg border p-4` 包 `InquiryCard` / `SupportInquiryForm`）。
  5. **授課**（`(isOwnPage && canTeach) || showTeacherSectionForAdmin`）：`IconChalkboard` + 標題；授課卡 grid ＋ `CourseSessionDialog` 按鈕。
  6. **管理者**（`isOwnPage && isAdmin`）：`IconShieldCheck` + 標題；「管理後台」連結。

  → 「card 包 card」＝ 區塊的 `rounded-lg border p-5` 外框裡再包 `rounded-md/rounded-lg border` 的內層卡片。

- **側邊留白疊加**：`app/[locale]/(user)/layout.tsx` `<main className="flex-1 p-6">`（兩處：L35 訪客精簡分支、L73 主分支）＝ 手機也 24px；＋ 區塊 `p-5`（20px）＋ 內卡 `p-4`（16px）。手機（~360px）實際內容寬度所剩不多。

**Topbar** `components/layout/topbar.tsx`（CR-SPEC-260829-001 後）：`'use client'`；`menuItems: { key, icon, label, badge?, onClick }[]` 陣列驅動手機 `Sheet` 選單；桌機為 `<div className="hidden md:flex ...">` 內一排 `<Button size="icon">`。衍生 `homeUrl` / `profileUrl` / `inquiriesUrl`（`spiritId ? '/user/{lower}/...' : fallback`）。已 import `IconHome/IconUser/IconBell/IconLayoutDashboard/IconClipboardList/IconMessageCircle/IconMessage/IconMenu2`。**未** import `IconNotebook`。

相關 OpenSpec capability：`student-profile-page`（頁路由與各本人專屬區塊）、`my-learning`（「首頁『我的學習』入口」Requirement）、`contact-admin`（「個人頁『聯繫管理者』區塊」Requirement）、`topbar`（CR-001 剛加的響應式收合）。

本次為 **純版面重構 ＋ 一個 Topbar 入口搬遷 ＋ 一個 i18n key**，不動資料查詢、server action、schema、路由。

## Goals / Non-Goals

**Goals：**
- 個人首頁頂層區塊不再有外框卡片（去「卡中卡」），內層卡片保留。
- 手機水平留白收斂（`<main>` `p-6` → `px-4 py-6 sm:p-6`）。
- 首頁移除「我的學習」區塊；該入口改由 Topbar（桌機按鈕列＋手機選單）提供。
- 首頁「聯繫管理者」區塊移到整頁最後。
- 桌機與手機表現一致；`sm`／`md` 以上不回退體驗。

**Non-Goals：**
- 不改 `CourseProgressCards` / `ContactAdminCards` / `CourseSessionCard` / `InquiryCard` 內部。
- 不動任何資料查詢、server action、Prisma schema、路由。
- 不改 `/user/{spiritId}/learning` 頁本身。
- 不改 `(guest)` / `(admin)` layout（僅 `(user)` layout 的 `<main>` padding）。
- 不改首頁的權限 / 顯示條件（`isOwnPage` / `canTeach` / `isAdmin` 等判定不動）。
- 不做首頁其他資訊架構調整（僅「去外框、搬 2 個區塊」）。

## Decisions

### 1. 去「卡中卡」：頂層區塊改為 `<section>`，區塊間以分隔線

外層維持 `<div className="space-y-8">`（由 `space-y-6` 微放大，補償外框移除後的視覺分組感）。每個區塊：

```tsx
<section className="space-y-4">
  <div className="flex items-center gap-2">
    <IconUser className="h-5 w-5 text-primary" />
    <h2 className="text-base font-semibold">基本資料</h2>
  </div>
  {/* ...內容（field rows / 內層卡片 grid）... */}
</section>
```

- **移除** 每個頂層區塊的 `rounded-lg border p-5`。
- 第 2 個起的區塊加 `border-t pt-8`（頂部細線分隔，無側框、無側 padding，不算「卡片」），第一個區塊不加。以 `className={cn('space-y-4', idx > 0 && 'border-t pt-8')}` 或直接逐區塊寫死。
- **內層卡片全部保留原樣**（`CourseProgressCards` 的三卡、`CourseCardGrid`/`CourseSessionCard`、`ContactAdminCards` 的提問卡）。
- 「我的學習」區塊整個刪除（見 Decision 3），故不在此列。
- 「聯繫管理者」區塊移到最後（見 Decision 4）。

> 為何保留 `border-t` 分隔線：純 `space-y` 在資訊密度高的首頁會讓區塊界線消失；`border-t pt-8` 提供結構卻不引入外框 / 側 padding，符合「不要 card 包 card、側邊間距太多」。實作時若視覺過重可退為僅 `space-y-8`。

### 2. `<main>` 手機水平留白

`app/[locale]/(user)/layout.tsx` 兩處：

```tsx
<main className="flex-1 px-4 py-6 sm:p-6">
```

- 手機：水平 16px、垂直 24px。`sm`（≥640px）以上回到 24px 四邊（與現況一致）。
- 訪客精簡分支（L35）與主分支（L73）同步，保持一致。
- 僅此檔、僅 `(user)` group；`(guest)` / `(admin)` layout 不動。

### 3. 首頁移除「我的學習」區塊；入口進 Topbar

**page.tsx**：刪除 L261–273 整段（`{isOwnPage && (<div className="rounded-lg border p-5"> ... 我的學習 ... </div>)}`）。`IconNotebook` import 若頁面他處未用則一併移除（`IconChevronRight` 仍被進度卡以外的地方用嗎？— 目前僅此段，確認後移除；`CourseProgressCards` 自己 import 自己的）。`getLearningProgressByCatalog` 仍供進度三卡，不動。

**components/layout/topbar.tsx**：

- import 增 `IconNotebook`。
- 衍生 `const learningUrl = spiritId ? \`/user/${spiritId.toLowerCase()}/learning\` : '/login'`（比照 `inquiriesUrl`）。
- **手機 `menuItems`**：在 `matchBoard` 與 `profile` 之間插入
  `{ key: 'learning', icon: IconNotebook, label: t('learning'), onClick: () => go(learningUrl) }`。
- **桌機按鈕列**：在「媒合布告欄」`<Button>` 之後、「個人資料」之前插入對應 `<Button variant="ghost" size="icon" onClick={() => router.push(learningUrl)} title={t('learning')}><IconNotebook className="h-5 w-5" /></Button>`。
- 位置一致（桌機、手機皆 `home → matchBoard → learning → (admin) → profile → help → messages → notifications`；註：CR-001 的 `menuItems` admin 是 spread 在 matchBoard 之後，桌機 admin 在 matchBoard 之後 — learning 放在 admin 之前或之後皆可，本設計放 **matchBoard 之後、admin 之前**以對齊兩處視覺順序，實作時以「兩處順序一致」為準）。

> 顯示條件：`我的學習` 對所有登入者顯示（與 `個人資料`／`聯絡管理者` 一致）；無 `spiritId` 時退 `/login`（極少數，理論上登入者皆有 `spiritId`）。不因「他人首頁」而隱藏——Topbar 恆以「當前登入者」的 `spiritId` 組 URL，本就指向自己的「我的學習」。

### 4. 首頁「聯繫管理者」區塊置底

`page.tsx`：把 `{isOwnPageEarly && (<section> ... 聯繫管理者 ... <ContactAdminCards/> </section>)}` 整段移到 return 內**最後**（授課單元、管理者單元之後）。區塊本身套用 Decision 1 的 `<section className="space-y-4 border-t pt-8">`。標題 `<Link href={\`/user/${id}/inquiries\`}>`、`<ContactAdminCards inquiries={myRecentInquiries} />` 不變。

改版後 return 區塊順序：
1. banners（`InstallBanner` / `ProfileBanner` / `GenderPromptDialog`）— 不變，維持在最上
2. `<h1>首頁</h1>`
3. 基本資料（`<section>`，無 `border-t`）
4. 課程（`<section className="... border-t pt-8">`）
5. 授課（條件；`<section className="... border-t pt-8">`）
6. 管理者（條件；`<section className="... border-t pt-8">`）
7. **聯繫管理者**（`isOwnPageEarly`；`<section className="... border-t pt-8">`）← 置底

### 5. i18n

- `messages/zh-TW.json` `nav`：加 `"learning": "我的學習"`。
- `messages/en.json` `nav`：加 `"learning": "My Learning"`。
- `npm run gen:zh-cn` → `messages/zh-CN.json`（勿手改）。
- Topbar 新按鈕 `title` / 選單 label 用 `t('learning')`，不寫死中文。首頁區塊標題維持既有寫死繁體（首頁 server component 現況即寫死中文，非本 CR 範圍）。

### 6. 不改動清單（防回歸）

- `CourseProgressCards`、`ContactAdminCards`、`CourseSessionCard`、`InquiryCard`、`SupportInquiryForm`：零改動。
- 首頁所有資料查詢（`getMyEnrollments` / `getMyCourseSessions` / `getMyCompletionCertificates` / `getLearningProgressByCatalog` / `getMyInquiries` / `getAllCourses` / `getAdminSetting` …）：零改動。
- 首頁權限與條件變數（`isOwnPage` / `isOwnPageEarly` / `canTeach` / `isAdmin` / `showTeacherSectionForAdmin` / `needTeacherData`）：零改動。
- `NotificationDrawer`、CR-001 的手機 `Sheet` 結構：除 `menuItems` 多一列外不動。

## Risks / Trade-offs

- **[取捨] 去外框後首頁「扁平」**：以 `border-t pt-8` 分隔線 ＋ `space-y-8` 維持區塊感；若團隊覺得仍太散，可再加回極輕量的 `bg-muted/30 rounded-lg`（無 border、極小 padding）——本設計先採最貼近字面的「純分隔線」。
- **[風險] `<main>` padding 全站生效**：`px-4 py-6 sm:p-6` 影響所有 `(user)` 頁面手機留白。這正是需求「側邊間距太多」的來源，屬預期；`sm` 以上不變，桌機零影響。各子頁若有自帶容器寬度限制不受影響。
- **[風險] Topbar 桌機按鈕數 7→8**：`md`（768px）以上；8 顆 `size="icon"`（約 320–360px）＋ Logo `truncate`，`md` 仍容得下（CR-001 已驗證 7 顆有餘裕）。
- **[取捨] 「我的學習」少一個首頁大入口**：改為 Topbar 常駐入口（每頁可達），可及性其實提升；首頁進度三卡在「已完成／進行中」時本就可點進 `/learning/{catalogId}`，深層入口仍在。
- **[風險] `IconNotebook` / `IconChevronRight` import 清理**：移除首頁「我的學習」段後，確認這兩個 icon 在 `page.tsx` 是否還有其他用處再決定刪除 import（`tsc --noEmit` / lint 會抓未使用）。

## Migration Plan

1. `app/[locale]/(user)/layout.tsx`：兩處 `<main>` `p-6` → `px-4 py-6 sm:p-6`。
2. `components/layout/topbar.tsx`：import `IconNotebook`；加 `learningUrl`；`menuItems` 與桌機按鈕列各插入「我的學習」。
3. `messages/zh-TW.json` / `messages/en.json`：`nav.learning`；`npm run gen:zh-cn`。
4. `app/[locale]/(user)/user/[spiritId]/page.tsx`：
   - 外層 `space-y-6` → `space-y-8`；各頂層區塊 `<div className="rounded-lg border p-5 space-y-4">` → `<section className="space-y-4">`（第 2 個起加 `border-t pt-8`）。
   - 刪除「我的學習」區塊；清理未使用 import。
   - 「聯繫管理者」區塊移到 return 最後。
5. `npm run lint`、`npx tsc --noEmit`、`npm run build`。
6. 手機（≤390px）／桌機（≥1024px）／`sm` 邊界（640px）實測：首頁無外框卡、留白收斂、區塊順序（聯繫管理者置底、無「我的學習」區塊）、Topbar 兩處新增「我的學習」可導頁。
7. `doc/學員手冊.md`：第八章「我的學習」入口位置改為「頂部工具列／選單」、「聯繫管理者」區塊位置說明；檔首版本 v0.1.185（2026-08-29）。`config/version.json` → 0.1.185。老師／管理者手冊不涉及。
8. `ai-context/` 相關章節（`03-architecture.md` Topbar 條、`07-current-tasks.md` 追加記錄）、`README-AI.md` 版本行。

**Rollback**：純 UI（3 檔）＋ 1 個 i18n key，無 schema / 資料 / 路由影響，revert commit 即可。

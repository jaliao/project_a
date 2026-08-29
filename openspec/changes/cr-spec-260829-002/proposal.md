## Why

需求單 CR-SPEC-260829-002（提出人：廖柏嘉 Justin，2026-08-29）：**「優化手機首頁排版」**。原文要點：

- 手機個人首頁（`/user/{spiritId}`）**不要「card 包 card」**——目前每個區塊都用 `rounded-lg border p-5` 外框包起來，外框裡又是一張張 `border` 小卡（進度三卡、課程卡、提問卡），視覺層層疊套。
- **側邊間距太多**——`(user)` layout 的 `<main>` 有 `p-6`（手機也是 24px），再加區塊外框的 `p-5`、內層卡片 `p-4`，窄螢幕實際內容寬度被吃掉很多。
- 首頁**拿掉「我的學習」區塊**，把入口**放到（Topbar）選單裡**。
- 首頁「聯繫管理者」區塊**移到整頁最下面**。

專案為手機優先，首頁是登入後最常看的頁，層層卡片與過寬留白在手機上尤其明顯。

## What Changes

### 1. 首頁去「卡中卡」＋收斂側邊留白

- `app/[locale]/(user)/user/[spiritId]/page.tsx`：頂層各區塊（基本資料、課程、授課、管理者、聯繫管理者）**移除 `rounded-lg border p-5` 外框**，改為「區塊標題（圖示＋`<h2>`）＋內容」直排，區塊之間沿用父層 `space-y-6`（或改 `space-y-8` ＋ `border-t pt-6` 分隔線，見 design）分隔。**內層卡片保留**（`CourseProgressCards` 的 `rounded-md border` 小卡、`CourseSessionCard`、`ContactAdminCards` 的 `rounded-lg border p-4` 提問卡不動）。
- `app/[locale]/(user)/layout.tsx`：`<main className="flex-1 p-6">` → `<main className="flex-1 px-4 py-6 sm:p-6">`（手機水平留白 24→16px，`sm` 以上維持）。兩處 `<main>`（訪客精簡分支與主分支）一致調整。影響所有 `(user)` 頁面的手機水平留白，屬「側邊間距太多」的正解。

### 2. 首頁移除「我的學習」區塊，入口移到 Topbar

- `page.tsx`：**刪除**「我的學習」區塊（`isOwnPage` 才顯示的 `IconNotebook` + 標題 + `IconChevronRight` 連結卡）。`getLearningProgressByCatalog` 等既有資料查詢不受影響（進度三卡仍用）。
- `components/layout/topbar.tsx`（CR-SPEC-260829-001 已改為「桌機平鋪按鈕群 ＋ 手機 `Sheet` 選單」）：**新增「我的學習」入口**，桌機按鈕列與手機 `menuItems` 皆加入——`IconNotebook`，導向 `/user/{spiritId}/learning`（`spiritId` 缺時退 `/login`，比照 `inquiriesUrl`）。位置：置於「媒合布告欄」之後、「個人資料」之前（桌機與手機一致）。
- i18n：`nav` 命名空間新增 `learning`（「我的學習」／「My Learning」）；`messages/zh-TW.json` ＋ `messages/en.json`，`npm run gen:zh-cn` 產生簡體。

### 3. 首頁「聯繫管理者」區塊移到最下面

- `page.tsx`：把 `isOwnPageEarly` 的「聯繫管理者」區塊（最近 2 筆提問卡 ＋ 表單卡）從目前第 3 順位，**移到所有區塊之後**（授課單元、管理者單元之下），成為整頁最後一個區塊。內容與行為（標題可點導向 `/user/{spiritId}/inquiries`、`ContactAdminCards`）不變。

**首頁區塊順序（改版後）**：基本資料 → 課程 →（授課，具講師身分才顯示）→（管理者，admin 才顯示）→ 聯繫管理者（本人才顯示，置底）。

## Capabilities

### Modified Capabilities
- `my-learning`：「首頁『我的學習』入口」由「個人首頁的獨立區塊」改為「Topbar（桌機按鈕列＋手機選單）的『我的學習』項目」，導向不變（`/user/{spiritId}/learning`）；個人首頁不再有「我的學習」區塊。
- `contact-admin`：個人頁「聯繫管理者」區塊位置由頁面上方改為**個人首頁最後一個區塊**；內容、顯示條件（僅本人）、標題連結不變。
- `student-profile-page`：新增「個人首頁版面」規格——頂層區塊不以外框卡片包裹（去「卡中卡」）、區塊順序（聯繫管理者置底、無「我的學習」區塊）、窄螢幕水平留白精簡；既有功能區塊（進度三卡、資料完整度、授課、管理者、性別補填）行為不變。
- `topbar`：新增「我的學習」入口項目（桌機按鈕列與手機選單一致），導向 `/user/{spiritId}/learning`。

## Impact

- **Affected code**：
  - 修改：`app/[locale]/(user)/user/[spiritId]/page.tsx`、`app/[locale]/(user)/layout.tsx`、`components/layout/topbar.tsx`、`messages/zh-TW.json`／`messages/en.json`、`doc/學員手冊.md`、`config/version.json`
  - 產生：`messages/zh-CN.json`（`npm run gen:zh-cn`）
  - 不變：`components/learning/course-progress-cards.tsx`、`components/support-inquiry/contact-admin-cards.tsx`、`components/course-session/*`、`lib/data/*`、所有 server action、Prisma schema
- **Database**：無 schema 變更。
- **既有資料**：不涉及。
- **UI / 行為**：
  - 個人首頁手機版視覺（無外框卡、留白收斂、區塊順序調整、少一個「我的學習」區塊）改變；桌機同步（外框移除、留白 `sm` 以上不變）。
  - `(user)` 全站頁面手機水平留白由 24px 收為 16px（`sm` 以上不變）。
  - Topbar 桌機按鈕列與手機選單各多一個「我的學習」項目。
  - 無新頁面、無路由變更、無權限變更。
- **Route access**：不變。
- **Dependencies**：無新增套件（`IconNotebook` 已在 `@tabler/icons-react`）。

## Open Questions

- 無。去外框範圍（首頁區塊外框 ＋ `<main>` 手機內距 `p-6`→`px-4 py-6 sm:p-6`）、「我的學習」入口位置（Topbar 桌機按鈕列＋手機選單皆加）、「聯繫管理者」置底皆已由使用者確認。

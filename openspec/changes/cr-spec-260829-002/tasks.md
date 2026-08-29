## 1. `app/[locale]/(user)/layout.tsx` — 手機水平留白

- [x] 1.1 L35（訪客精簡分支）`<main className="flex-1 p-6">` → `<main className="flex-1 px-4 py-6 sm:p-6">`
- [x] 1.2 L73（主分支）`<main className="flex-1 p-6">` → `<main className="flex-1 px-4 py-6 sm:p-6">`
- [x] 1.3 更新檔首標準註解區塊日期為 `(Updated: 2026-08-29)`

## 2. `components/layout/topbar.tsx` — 新增「我的學習」入口

- [x] 2.1 import 增 `IconNotebook`（併入現有 `@tabler/icons-react` 那行）
- [x] 2.2 衍生值加 `const learningUrl = spiritId ? \`/user/${spiritId.toLowerCase()}/learning\` : '/login'`（緊接 `inquiriesUrl` 之後）
- [x] 2.3 `menuItems` 陣列：在 `matchBoard` 與（admin spread 之後的）`profile` 之間插入 `{ key: 'learning', icon: IconNotebook, label: t('learning'), onClick: () => go(learningUrl) }`
- [x] 2.4 桌機按鈕列：在「媒合布告欄」`<Button>` 之後、「後台管理」之前插入 `<Button variant="ghost" size="icon" onClick={() => router.push(learningUrl)} title={t('learning')}><IconNotebook className="h-5 w-5" /></Button>`（桌機與手機順序一致：home → matchBoard → learning → (admin) → profile → help → messages → notifications）
- [x] 2.5 更新檔首標準註解區塊日期為 `(Updated: 2026-08-29)`

## 3. i18n

- [x] 3.1 `messages/zh-TW.json` `nav` → 加 `"learning": "我的學習"`
- [x] 3.2 `messages/en.json` `nav` → 加 `"learning": "My Learning"`
- [x] 3.3 `npm run gen:zh-cn` 重新產生 `messages/zh-CN.json`（勿手改簡體）
- [x] 3.4 確認 Topbar 新按鈕 `title` / 選單 label 皆走 `t('learning')`，無寫死中文

## 4. `app/[locale]/(user)/user/[spiritId]/page.tsx` — 去外框、移除我的學習、聯繫管理者置底

- [x] 4.1 外層容器 `<div className="space-y-6">` → `<div className="space-y-8">`
- [x] 4.2 「基本資料」區塊：`<div className="rounded-lg border p-5 space-y-4">` → `<section className="space-y-4">`（第一個區塊，不加 `border-t`）
- [x] 4.3 「課程」區塊：外框 → `<section className="space-y-4 border-t pt-8">`
- [x] 4.4 **刪除**「我的學習」區塊整段（`{isOwnPage && (<div className="rounded-lg border p-5"> ... <IconNotebook/> 我的學習 ... </div>)}`）
- [x] 4.5 「授課」區塊：外框 → `<section className="space-y-4 border-t pt-8">`（條件表達式不變）
- [x] 4.6 「管理者」區塊：外框 → `<section className="space-y-4 border-t pt-8">`（條件表達式不變）
- [x] 4.7 「聯繫管理者」區塊：外框 → `<section className="space-y-4 border-t pt-8">`，並將整段 `{isOwnPageEarly && (...)}` **移到 return 內最後**（授課、管理者區塊之後）；標題 `<Link>` 與 `<ContactAdminCards>` 內容不變
- [x] 4.8 內層卡片零改動（`CourseProgressCards`、`CourseCardGrid`/`CourseSessionCard`、`ContactAdminCards`）；資料查詢與 `isOwnPage`/`canTeach`/`isAdmin` 等條件變數零改動
- [x] 4.9 清理未使用 import：移除首頁「我的學習」段後，若 `IconNotebook` / `IconChevronRight` 在 `page.tsx` 已無其他用處則移除（以 `npx tsc --noEmit` / lint 確認）
- [x] 4.10 更新檔首標準註解區塊日期為 `(Updated: 2026-08-29)`

## 5. 驗證

- [x] 5.1 `npm run lint`：本次檔案 0 error
- [x] 5.2 `npx tsc --noEmit`：0 error
- [x] 5.3 `npm run build`（含 prebuild `gen:zh-cn`）：`✓ Compiled successfully`
- [~] 5.4 **（人工實測）** 手機（≤390px）：個人首頁無「卡中卡」外框、左右留白明顯收斂、區塊以分隔線區隔
- [~] 5.5 **（人工實測）** 首頁不再有「我的學習」區塊；Topbar 桌機按鈕列與手機選單皆有「我的學習」，點擊導向 `/user/{spiritId}/learning`
- [~] 5.6 **（人工實測）** 首頁「聯繫管理者」區塊在最下方（授課／管理者之後）；標題可點、最近提問卡與表單卡正常
- [~] 5.7 **（人工實測）** 桌機（≥1024px）：首頁外框移除但 `sm` 以上四邊留白不變；Topbar 8 顆按鈕不溢出
- [~] 5.8 **（人工實測）** `sm` 邊界（640px）：`<main>` 由 `px-4` 切回 `p-6` 無跳動異常
- [~] 5.9 **（人工實測）** 迴歸：進度三卡（三態、可點性）、授課單元、管理者單元、性別補填對話框、他人視角（無授課／管理者／聯繫管理者區塊）皆與改版前一致

## 6. 文件與版本號同步

- [x] 6.1 `doc/學員手冊.md`：第八章「我的學習」入口位置改為「頂部工具列／右上角『選單』」；「聯繫管理者」相關小節補「位於個人首頁最下方」；檔首版本 → v0.1.185（2026-08-29）
- [x] 6.2 `doc/老師手冊.md`／`doc/管理者操作手冊.md`：`grep` 確認無「我的學習」首頁區塊敘述；如僅頂部工具列敘述，補一句「頂部工具列新增『我的學習』」即可（無則不動）
- [x] 6.3 `config/version.json`：`0.1.184` → `0.1.185`，`updatedAt` → `2026-08-29`
- [x] 6.4 `ai-context/03-architecture.md`：Topbar 條目補「我的學習」入口；`page.tsx`/layout 版面說明如有則同步
- [x] 6.5 `ai-context/07-current-tasks.md`：於「已完成」最前追加本 CR 記錄
- [x] 6.6 `README-AI.md`：版本行 → 0.1.185

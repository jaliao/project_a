# 個人首頁整合學習進度與結業證明（cr-spec-260702-006）

## Why

學習資訊目前散落三處：`/learning` 學習紀錄頁（進度摘要＋結業表格＋授課表格）、個人首頁的「結業證明」區塊、他人視角的「學習紀錄預覽」，內容重複且入口分歧。將學習進度與結業資訊合併進個人首頁（`/user/[spiritId]`）的基本資料區塊，一眼即可看到三門課的完成狀態與結業時間。

## What Changes

- 個人首頁基本資料區塊內**固定顯示三張課程卡片**：啟動靈人、啟動豐盛、啟動得勝（依課程目錄順序，無論有無紀錄都顯示）：
  - 未結業：未完成樣式（比照現行 LevelProgress 的虛線／灰階呈現）
  - 已結業：完成樣式，卡片顯示**學業完成時間**（`graduatedAt`，同目錄多筆取最新；可含班名／授課老師沿用結業證明資訊）
  - 與原結業證明相同為**公開資訊**（本人與他人視角皆可見）
- **刪除 `/learning` 頁面**（整個路由）；`LevelProgress` 元件與 `learning.*` i18n keys 隨之移除（無其他使用處）
- **刪除個人首頁原「結業證明」區塊**（`CompletionCertificateCard` 列表）
- **刪除他人視角「學習紀錄預覽」區塊**（資訊已由固定三卡涵蓋；其「查看更多」原導向被刪除的 `/learning`）
- 本人視角「學習紀錄」面板（結業狀態＋學習歷程回饋入口）**保留不動**——回饋入口自此僅存在於個人首頁
- `app/actions/learning-feedback.ts` 內 `revalidatePath('/learning')` 改指個人首頁路徑

## Capabilities

### New Capabilities
（無——行為整合進既有 capability）

### Modified Capabilities
- `student-profile-page`: 基本資料區塊新增固定三卡（學習進度＋結業時間）之要求
- `completion-certificate`: 移除「學員頁面顯示結業證明區塊」要求，結業資訊改由基本資料區塊固定三卡承載（每目錄一張、取最新 `graduatedAt` 之規則沿用）
- `learning-records`: 移除「學習紀錄頁面」「學習進度摘要」「Dashboard 學習紀錄入口」要求（`/learning` 刪除；進度整合至個人首頁）
- `dashboard-function-units`: 移除學習單元中導向 `/learning` 之連結描述（該頁已不存在；現行 dashboard 實作亦已無此連結）

## Impact

- **頁面**：`app/[locale]/(user)/user/[spiritId]/page.tsx`（基本資料區塊改造、移除結業證明區塊與他人視角預覽）；刪除 `app/[locale]/(user)/learning/` 整個目錄
- **元件**：刪除 `components/learning/level-progress.tsx`；`components/course-invite/completion-certificate-card.tsx` 視新卡片設計沿用或刪除；新增（或改造）固定三卡元件
- **資料層**：沿用 `getMyCompletionCertificates`（每目錄最新結業）＋課程目錄 `getAllCourses`；無 schema 變更、無 migration
- **i18n**：移除 `messages/*.json` 的 `learning.*` 命名空間（僅 `/learning` 使用）；個人頁為繁體固定文案區域
- **server actions**：`learning-feedback.ts` 的 `revalidatePath` 路徑調整
- **手冊**：`doc/學員手冊.md`（學習紀錄／結業證明章節改寫）、必要時 `doc/老師手冊.md`；`config/version.json` patch +1

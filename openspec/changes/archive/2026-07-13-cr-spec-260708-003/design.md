# 課程頁面字體大小標準化 — 技術設計

## Context

學員頁面（`/user/[spiritId]`）已建立區塊標題標準：`<div className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><h2 className="text-base font-semibold">…</h2></div>`，內文 `text-sm`、標籤/時間戳 `text-xs text-muted-foreground`。課程詳情頁各區塊標題混用 `text-sm font-medium text-muted-foreground`（基本資訊/學員/FAQ）、`text-sm font-semibold`（講師操作區 Section h3）、`text-sm font-medium text-green-800`（結業資訊），皆無 icon。

## Goals / Non-Goals

**Goals:**
- 課程頁八類區塊標題統一為 icon＋`text-base font-semibold`；內文/輔助字級一致；FAQ 全面對齊。

**Non-Goals:**
- 不改任何功能行為、DOM 結構語意（h2/h3 層級維持）、i18n key、資料層。
- 不動其他頁面（學員頁面是基準、不改）。

## Decisions

1. **標題樣式完全複製學員頁面 pattern**
   `flex items-center gap-2` 容器＋`h-5 w-5 text-primary` icon＋`text-base font-semibold` 標題。結業資訊區塊底色為綠色系，icon 用 `text-green-700` 融入既有主題（其餘一律 `text-primary`）、標題移除 `text-green-800` 改標準色（`font-semibold` 已足辨識）——保留綠框綠底不動。

2. **各區塊 icon 選用（tabler，既有相依）**
   課程基本資訊 IconInfoCircle、結業資訊 IconCertificate、已核准學員 IconUsers、待審申請 IconUserQuestion（無則 IconUserExclamation）、教材申請作業 IconBook、開始上課作業 IconPlayerPlay、取消上課作業 IconBan、公開媒合 IconSpeakerphone、學員申請區 IconClipboardCheck（無則近義替代）、FAQ IconMessageCircle。實作時以 @tabler/icons-react 實際存在者為準。

3. **`course-detail-actions.tsx` 的 `Section` 元件加 `icon` prop**
   三個操作區塊共用 Section（h3）；加選用 icon prop 套同樣式，h3 改 `text-base font-semibold`，一處改全部生效。

4. **內文/輔助字級規則**
   內文與表單輸入 `text-sm`；說明、標籤、時間戳 `text-xs text-muted-foreground`。FAQ：標題套標準、提問/回覆內文維持 `text-sm`、作者名 `text-sm font-medium`、時間戳維持 `text-xs`（已符合者不動，只收斂不一致處）。

## Risks / Trade-offs

- **[純樣式變更誤動行為]** → 僅 className 與 icon 增添，diff 易審；build＋手動走查把關。

## Migration Plan

無 migration；部署即生效。回滾為還原程式碼。

## Open Questions

（無）

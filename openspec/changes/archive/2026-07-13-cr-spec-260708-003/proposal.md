# 課程頁面字體大小標準化

## Why

課程詳情頁各區塊標題樣式不一致（`text-sm font-medium text-muted-foreground`、`text-sm font-semibold`……），與學員頁面已建立的標準（**icon＋`text-base font-semibold`**）不同調；內文字體大小也有落差，FAQ 區尤其明顯（標題過小、與其他區塊不齊）。需要統一為與學員頁面相同的字體階層。

## What Changes

- 課程詳情頁**所有區塊標題**改為學員頁面標準：**icon（`h-5 w-5 text-primary`）＋`text-base font-semibold`**。涵蓋：課程基本資訊、結業資訊、已核准學員、待審申請、講師操作區（教材申請／開始上課／取消上課三塊）、公開媒合、學員申請區、課程 FAQ。
- **內文字體統一**：內文 `text-sm`、輔助說明與時間戳 `text-xs text-muted-foreground`；FAQ 區（提問/回覆內文、作者、時間戳、輸入框）全面對齊此標準。
- 各區塊 icon 依語意選用 tabler icons（如基本資訊 IconInfoCircle、學員 IconUsers、FAQ IconMessageCircle 等）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `course-session-detail`: 新增「區塊標題與內文字體標準」requirement（icon＋粗體標題、內文/輔助字級一致，比照學員頁面）。

## Impact

- **程式碼**：`app/[locale]/(user)/course/[id]/page.tsx`（各區塊標題）、`course-detail-actions.tsx`（Section 元件）、`components/course-faq/course-faq.tsx`、`components/course-session/`（PendingEnrollmentList、MatchSettingsEditor、StudentApplySection 等區塊標題）。純樣式變更，無邏輯/資料異動。
- **文件**：無流程變更，手冊免改；version.json patch +1（含 updatedAt）；README-AI 更新。
- **不影響**：任何功能行為、i18n key、資料層。

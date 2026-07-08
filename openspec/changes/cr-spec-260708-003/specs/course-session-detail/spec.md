# course-session-detail Delta Specification

## ADDED Requirements

### Requirement: 區塊標題與內文字體標準
課程詳情頁所有內容區塊（課程基本資訊、結業資訊、已核准學員、待審申請、講師操作區各段、公開媒合、學員申請區、課程 FAQ）的標題 SHALL 採統一樣式：**語意對應的 icon＋粗體標題（`text-base font-semibold`）**，比照學員頁面（`/user/[spiritId]`）既有標準。
內文字級 SHALL 一致：內文 `text-sm`；輔助說明、標籤與時間戳 `text-xs`（muted）。FAQ 區塊的提問/回覆內文、作者名與時間戳 SHALL 套用相同標準。

#### Scenario: 區塊標題樣式一致
- **WHEN** 使用者開啟課程詳情頁
- **THEN** 每個內容區塊標題皆為 icon＋粗體字（text-base font-semibold），無區塊沿用舊的小字灰階標題

#### Scenario: FAQ 字級對齊
- **WHEN** 使用者檢視課程 FAQ 區塊
- **THEN** 區塊標題為 icon＋粗體字；提問與回覆內文為 text-sm、時間戳為 text-xs，與頁面其他區塊一致

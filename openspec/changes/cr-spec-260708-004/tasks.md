# Tasks — 手機排版優化：學員頁卡片＋學習紀錄＋課程頁頁首（cr-spec-260708-004）

## 1. 課程卡片（CourseSessionCard）

- [x] 1.1 `course-session-card.tsx` 標題區改垂直堆疊：標籤列（公開招生/等級/狀態，維持 sm）在上、標題獨占一行在下（不 truncate）；props 介面不變

## 2. 學習紀錄卡片化

- [x] 2.1 `components/learning/feedback-entry.tsx` 結業狀態 `<table>` 改卡片列（課程名稱＋狀態徽章／老師名小字／未結業卡帶「這有誤？回報」入口，行為與預帶不變）
- [x] 2.2 同檔「我的回饋狀態」`<table>` 改卡片列（類別/課程/狀態/管理者備註），i18n key 沿用

## 3. 課程頁頁首

- [x] 3.1 `page.tsx` 頁首：第一列標籤（sm 原本大小）、第二列標題獨占一行；「編輯」「複製邀請連結」按鈕移至課程基本資訊卡片內底部一列
- [x] 3.2 `course-catalog-badge.tsx` md variant 維持原樣（曾調大後依使用者回饋恢復）

## 3.5 操作按鈕樣式一致

- [x] 3.3 `course-detail-actions.tsx`「結業」兩處按鈕移除 `variant="outline"` 改預設主色（與開始上課一致）
- [x] 3.4 `course-faq.tsx`「送出提問」「送出回覆」移除 `size="sm"` 改預設尺寸；破壞性按鈕（刪除留言/取消授課）不動
- [x] 3.5 `course-faq.tsx` 兩個 Textarea 加 `text-sm`——shadcn Textarea 手機預設 text-base（16px）造成 placeholder「對課程有疑問嗎…」比周圍字大，限縮與內文一致

## 4. 版本與文件

- [x] 4.1 `config/version.json` patch +1＋updatedAt（純樣式，手冊免改）
- [x] 4.2 依 `.ai-rules.md` 更新 `README-AI.md`

## 5. 驗證

- [x] 5.1 `npm run lint` 與 `npm run build` 通過
- [x] 5.2 手動驗證（手機視窗）：①個人頁/我的授課/match-board 課程卡標籤在標題上方、長標題不折行擠壓；②學習紀錄與回饋狀態為卡片、無水平捲動、回報入口可用；③課程頁第一列標籤+按鈕、第二列標題，標籤與按鈕同級大小

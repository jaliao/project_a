# 課程資訊頁手機版優化＋結業資訊可見性修正 — 技術設計

## Context

課程詳情頁 `app/[locale]/(user)/course/[id]/page.tsx`（server 元件、i18n `course.detail.*`）：
- 頁首為 `flex items-start justify-between`——左側 h1 標題與等級/狀態標籤同列 `flex-wrap`，右側編輯 Dialog trigger（「編輯課程資訊」文字按鈕）＋複製連結按鈕；手機上標題被擠壓折行。
- 基本資訊區塊順序：授課老師 → 預計開課日期 →（開始上課日期 → 結業日期，260703-001 新增）→ 報名截止日期 → 報名人數。
- 已核准學員為 `divide-y` 表列：姓名＋Email 左側、教材標籤＋加入日期右側。
- 結業資訊可見性 `canViewGraduation = canTeachAny(roles)`——任一講師身分可見**任何**課程結業資訊（spec 當初即如此定義，屬規格過寬）。

## Goals / Non-Goals

**Goals:**
- 手機版頁首：標題不折行（獨立成行、不被標籤/按鈕擠壓）、標籤與按鈕重排。
- 「課程基本資訊」標題與六欄位新順序；「結業日期」label 改「課程結業日期」。
- 已核准學員卡片式排版、移除 Email。
- 結業資訊僅**該課程授課老師（建立者）或管理者**可見。

**Non-Goals:**
- 不動結業資訊區塊內容本身（名單/評分/最後一堂日期照舊）。
- 不動資料層（`approvedEnrollments` select 保留，僅顯示層拿掉 Email）。
- 不動後台與其他頁面。

## Decisions

1. **「標題不折行」解讀為「標題獨占整行、不與標籤/按鈕同列」**
   標題移出與標籤共用的 flex 列：第一行標題（過長時自然換行顯示完整字串，不 truncate 也不被按鈕擠壓）；第二行標籤列（等級＋狀態，`flex flex-wrap`）與操作按鈕（編輯/複製連結）同列兩端對齊。手機與桌機採同一結構（垂直堆疊），免去斷點分歧。

2. **編輯按鈕：icon＋「編輯」**
   `EditCourseInfoDialog` trigger 改為 `IconEdit`（tabler）＋文字「編輯」；優先重用既有 `common.edit` key，無則新增 `course.editInfo.editButton`。DialogTitle 維持原「編輯課程資訊」key 不動。

3. **基本資訊順序以 DOM 重排實現**
   區塊標題 key `course.detail.basicInfo` 值改「課程基本資訊」／en "Course info"；`completedDate` 值改「課程結業日期」／en "Course completion date"。欄位 DOM 依序：授課老師、報名人數、預計開課日期、報名截止日期、開始上課日期（有值才顯示）、課程結業日期（有值才顯示）；grid 維持 `sm:grid-cols-2`（手機單欄由上而下即為指定順序）。

4. **學員卡片：grid 卡片取代 divide-y 表列**
   `grid grid-cols-1 sm:grid-cols-2 gap-3`，每張卡片 `rounded-lg border p-3`：第一行姓名（font-medium），第二行教材標籤＋加入日期（小字、muted）。**不渲染 Email**。空狀態文案照舊。

5. **結業資訊可見性：頁面層判定改 `isInstructor || isAdmin`**
   移除 `canTeachAny` 引用（此頁若無他用）；spec 同步 MODIFIED。結業資訊為頁面 server 端條件渲染，無 API 洩漏面（資料不會送到 client）。

## Risks / Trade-offs

- **[其他講師失去跨課結業檢視]** → 本來就是規格過寬造成的洩漏（學員可見他班名單），收斂為明確授權者；管理者仍可見全部。
- **[spec delta 疊在未歸檔的 260703-001 之上]** → 本變更 MODIFIED 以 260703-001 修改後文本為基底；**歸檔順序必須 260703-001 → 本變更**。

## Migration Plan

無 migration；部署即生效。回滾為還原程式碼。

## Open Questions

（無）

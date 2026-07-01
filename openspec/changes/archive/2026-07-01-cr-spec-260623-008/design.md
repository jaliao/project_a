## Context

結業流程：老師按「結業」→ `graduation-form`（填最後上課日 ＋ 逐位學員結業/未結業 → 預覽 → 送出）→ `graduateCourse`（`app/actions/course-invite.ts:409`）寫入各 `InviteEnrollment.graduatedAt`、`CourseInvite.completedAt`，並寄結業信。

- `CourseInvite` 現有 `completedAt`、`notes`，**無**班級層級的評分/見證欄位。
- 結業資訊呈現於 `app/[locale]/(user)/course/[id]/page.tsx`（`isCompleted && canViewGraduation`＝管理者＋老師可見），顯示最後上課日、已/未結業名單；資料由 `lib/data/course-sessions.ts` 的課程詳情查詢提供。

## Goals / Non-Goals

**Goals:**
- 結業送出時，老師可對**整班**填「本次學員整體學習狀況」＝**五星評分（1–5）＋見證（文字）**，皆選填。
- 寫入 `CourseInvite.gradRating` / `gradTestimony`（一課一則）。
- 結業資訊區塊（管理者＋老師）顯示老師填寫的五星與見證。

**Non-Goals:**
- 不做逐位學員評分/見證（本批為班級層級）。
- 不做學員自填見證。
- 不外露前台學員（顯示沿用 `canViewGraduation`）。
- 不變更結業信內容。

## Decisions

1. **資料模型**：`CourseInvite` 新增 `gradRating Int?`（1–5）、`gradTestimony String?`；migration `add_graduation_feedback`（兩個 nullable 欄，非破壞性）。
2. **`graduateCourse` 參數擴充**：加 `rating?: number | null`、`testimony?: string | null`；於設定 `completedAt` 的同一 `CourseInvite.update` 一併寫入。伺服器端驗證：`rating` 僅接受 1–5，否則存 null；`testimony` trim 後空字串存 null（上限 500 字）。
3. **`graduation-form` 填寫步驟**新增「本次學員整體學習狀況」區：五星選擇器（可清除為未評）＋見證 `textarea`（500 字上限）。狀態隨表單、傳入 `graduateCourse`。預覽步驟帶出摘要（星等＋見證）。**選填**——不納入 `handleToPreview` 的必填驗證。
4. **顯示**：`course/[id]/page.tsx` 結業資訊區塊於「最後一堂課程日期」旁/下新增「整體學習狀況」：星等圖示（`gradRating`）＋見證文字（`gradTestimony`）；**兩者有值才顯示**（舊課程/未填則整段省略）。`lib/data/course-sessions.ts` 課程詳情 select 補 `gradRating`、`gradTestimony`。
5. **五星 UI**：以 Tabler `IconStar` / `IconStarFilled` 實作 client 星等選擇（表單本即 client component），點同一星可清除為未評。
6. 老師前台表單字串維持繁體（非 i18n 範圍）。

## Risks / Trade-offs

- 班級層級單值：未來若要逐生評分需再擴充（本批不做）。
- 選填導致「有些課程有、有些沒有」→ 顯示端以「有值才顯示」避免空區塊。
- `rating` 驗證需前後端一致（1–5 或 null）；前端清除＝送 null。
- migration 為新增 nullable 欄，非破壞性、無需回填。

## 1. 資料模型

- [x] 1.1 `prisma/schema/course-invite.prisma`：`CourseInvite` 新增 `isPublicMatch Boolean @default(false)` 與 `matchNote String?`
- [x] 1.2 建立並套用 migration `add_course_public_match`（新增兩欄）、`prisma generate`

## 2. 開課流程（建立時設定公開媒合）

- [x] 2.1 `lib/schemas/course-session.ts`：新增 `isPublicMatch: boolean`（預設 false）與 `matchNote: string`（optional、trim、最長 500）
- [x] 2.2 `app/actions/course-session.ts`：`createCourseSession` 寫入 `isPublicMatch`、`matchNote`（關閉時 matchNote 可空）
- [x] 2.3 開課精靈基本資料步驟：新增「公開媒合」開關（預設關）+ 招募備註欄位（開啟時顯示），串接表單值

## 3. 編輯（課程詳情頁）

- [x] 3.1 新增 Server Action `updateMatchSettings(inviteId, { isPublicMatch, matchNote })`：僅課程講師（`createdById === session.user.id`）或管理者；關閉時保留 matchNote；`revalidatePath` 詳情頁 + 布告欄
- [x] 3.2 課程詳情頁講師專屬區塊：公開媒合開關 + 招募備註編輯 UI（client 元件），呼叫 `updateMatchSettings`

## 4. 媒合布告欄

- [x] 4.1 `lib/data/`：新增 `getPublicMatchingSessions()`，條件 `isPublicMatch && !cancelledAt && !completedAt && (expiredAt null 或 >= 今日)`，select 卡片所需欄位 + `matchNote` + 講師顯示名，依 `createdAt` 新→舊
- [x] 4.2 `components/course-session/course-session-card.tsx`：新增選填 prop（`matchNote?`、`showMatchBadge?`）顯示「公開媒合／招募中」badge 與招募備註區（無備註不顯示）
- [x] 4.3 新增頁面 `app/(user)/match-board/page.tsx`（Server Component，所有登入會員可存取）：以 `CourseCardGrid` + `CourseSessionCard` 列出，空清單顯示提示

## 5. 入口

- [x] 5.1 `components/layout/topbar.tsx`：右上角新增「媒合布告欄」按鈕（Tabler icon），導向 `/match-board`，所有登入會員可見

## 6. 收尾與驗證

- [x] 6.1 `npm run build` TypeScript 型別檢查通過
- [x] 6.2 手動驗證：開課設公開＋備註 → 布告欄出現卡片＋badge＋備註；關閉公開→消失但備註保留；過期/取消/結業不顯示；非講師無法修改；右上角入口可達（待使用者於 dev 驗證）
- [x] 6.3 依 `.ai-rules.md` 更新 `README-AI.md`，`config/version.json` patch +1

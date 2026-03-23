## 1. DB Schema 變更

- [x] 1.1 在 `prisma/schema/course-invite.prisma` 的 `CourseInvite` 模型新增 `expiredAt DateTime?`
- [x] 1.2 執行 `make schema-update name=add_expired_at_to_invite`
- [x] 1.3 確認 migration 成功、Prisma client 已重新產生

## 2. UI 元件安裝

- [x] 2.1 確認 shadcn Calendar 元件是否已安裝（檢查 `components/ui/calendar.tsx`）
- [x] 2.2 若未安裝，執行 `npx shadcn@latest add calendar --legacy-peer-deps`

## 3. Zod Schema 與 Server Action

- [x] 3.1 建立 `lib/schemas/course-session.ts`，合併 CourseOrder + CourseInvite 欄位（含 courseLevel、expiredAt、maxCount）
- [x] 3.2 在 courseSession schema 加入 expiredAt 不早於今天的 superRefine 驗證
- [x] 3.3 建立 `app/actions/course-session.ts`，實作 `createCourseSession` Server Action
- [x] 3.4 `createCourseSession` 使用 `prisma.$transaction()` 同步建立 CourseOrder + CourseInvite（帶 courseOrderId、courseLevel、expiredAt）
- [x] 3.5 Action 回傳標準 ActionResponse，成功含邀請連結資訊

## 4. DatePicker 共用元件

- [x] 4.1 建立 `components/ui/date-picker.tsx`（Calendar + Popover + Button trigger 封裝），接受 value / onChange props

## 5. 合併表單元件

- [x] 5.1 建立 `components/course-session/course-session-form.tsx`，定義 DEV_DEFAULTS 常數（含所有欄位測試資料）
- [x] 5.2 表單 `defaultValues` 依 `process.env.NODE_ENV === 'development'` 選擇 DEV_DEFAULTS 或空值
- [x] 5.3 新增課程 Select 欄位，選項來自 `COURSE_CATALOG` isActive 課程
- [x] 5.4 新增預計開課日期欄位，使用 DatePicker 元件
- [x] 5.5 新增邀請截止日期欄位，使用 DatePicker 元件
- [x] 5.6 整合 CourseOrder 原有欄位（buyerNameZh、buyerNameEn、teacherName、churchOrg、email、phone、materialVersion、purchaseType、studentNames、quantityOption、quantityNote、taxId、deliveryMethod）
- [x] 5.7 表單使用 ScrollArea 包裹，確保小螢幕可捲動
- [x] 5.8 建立 `components/course-session/course-session-dialog.tsx`，包裝 Dialog + CourseSessionForm

## 6. 學員清單元件

- [x] 6.1 建立 `components/course-session/enrolled-students-list.tsx`（Server Component）
- [x] 6.2 查詢最新一筆 CourseInvite 的 InviteEnrollment，include user（realName、nickname、name）
- [x] 6.3 顯示格式：「{realName} | {nickname}」與接受時間（YYYY/MM/DD HH:mm）
- [x] 6.4 無學員時顯示「尚無學員接受邀請」提示

## 7. Dashboard 首頁整合

- [x] 7.1 修改 `app/(user)/dashboard/page.tsx`，在統計卡片下方新增「新增開課」區塊
- [x] 7.2 區塊包含「新增開課」按鈕（觸發 CourseSessionDialog）與 EnrolledStudentsList
- [x] 7.3 確認頁面已設定 `export const dynamic = 'force-dynamic'`

## 8. 版本與文件更新

- [x] 8.1 將 `config/version.json` patch 版本號 +1
- [x] 8.2 依 `.ai-rules.md` 規範更新 `README-AI.md`

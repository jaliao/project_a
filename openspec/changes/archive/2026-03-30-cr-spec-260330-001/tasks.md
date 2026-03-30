## 1. Server Action — Spirit ID 邀請

- [x] 1.1 在 `app/actions/course-invite.ts` 新增 `inviteBySpirtId(courseInviteId, spiritId)` action
- [x] 1.2 實作 Spirit ID 查找邏輯（`User.spiritId === spiritId`）
- [x] 1.3 驗證 CourseInvite 存在，取得 token 與課程名稱
- [x] 1.4 呼叫 `createNotification` 發送 Inbox 通知（title: `課程邀請`，body 含課程名稱與邀請連結）
- [x] 1.5 處理 Spirit ID 不存在與 courseInviteId 無效的錯誤回傳

## 2. 精靈主容器元件

- [x] 2.1 建立目錄 `components/course-session/create-course-wizard/`
- [x] 2.2 建立 `create-course-wizard.tsx`：管理 `step` state（`1 | 2 | 3 | 'invite'`）與跨步驟表單資料彙整
- [x] 2.3 從 Dashboard Server Component 取得 `canTeach` 並傳入精靈，`canTeach = false` 時按鈕 disabled

## 3. Step 1 — 卡片式課程選擇

- [x] 3.1 建立 `step-1-course-card.tsx`：從 `COURSE_CATALOG` 篩選 `isActive: true` 課程並渲染卡片
- [x] 3.2 實作卡片選中樣式（border/ring）與點擊選取邏輯
- [x] 3.3 顯示先修條件說明（啟動靈人 2 顯示「需先完成靈人啟動 1」）
- [x] 3.4 使用者為 `user` 身分且選擇超出其講師等級的課程時，卡片顯示資格提示
- [x] 3.5 未選課程時「下一步」保持 disabled

## 4. Step 2 — 基本資料填寫

- [x] 4.1 建立 `step-2-basic-info.tsx`：預計開課日期（DatePicker）、邀請截止日期（DatePicker）、預計人數
- [x] 4.2 實作截止日期早於今天的驗證錯誤
- [x] 4.3 必填欄位空白時「下一步」保持 disabled
- [x] 4.4 `NODE_ENV === 'development'` 時自動填入 DEV_DEFAULTS

## 5. Step 3 — 預覽確認

- [x] 5.1 建立 `step-3-preview.tsx`：唯讀摘要（課程名稱、日期、預計人數）
- [x] 5.2 點擊「確認開課」呼叫現有 `createCourseSession` action
- [x] 5.3 成功後切換至 `'invite'` 步驟，顯示「開課單已建立！」toast
- [x] 5.4 失敗時顯示錯誤提示，維持在 Step 3

## 6. 邀請學員階段

- [x] 6.1 建立 `invite-step.tsx`：顯示邀請連結 + 複製按鈕（沿用 `invite-copy-button.tsx`）
- [x] 6.2 新增 Spirit ID 輸入欄位與「送出邀請」按鈕
- [x] 6.3 Spirit ID 為空時「送出邀請」保持 disabled
- [x] 6.4 呼叫 `inviteBySpirtId` action，成功後顯示 toast 並清空輸入欄
- [x] 6.5 Spirit ID 不存在時顯示欄位錯誤訊息

## 7. 整合既有入口

- [x] 7.1 修改 `components/course-session/course-session-dialog.tsx`，改為 render `<CreateCourseWizard />`，移除舊的 `course-session-form.tsx` 使用
- [x] 7.2 從 Dashboard 查詢登入使用者的結業證書，計算 `canTeach` 並傳入 Dialog

## 8. 版本與文件更新

- [x] 8.1 將 `config/version.json` patch 版本號 +1
- [x] 8.2 依 `.ai-rules.md` 更新 `README-AI.md`

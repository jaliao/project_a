## 1. Server Action（app/actions/course-session.ts）

- [x] 1.1 新增 `setCourseStatusAdmin(inviteId: number, target: 'recruiting' | 'started' | 'cancelled')`，以 `auth()` + `canAccessAdmin(roles)` 守衛，非管理者回 `{ success: false, message: '無權限' }`
- [x] 1.2 驗證 `target` 為三個合法值之一；拒絕 `completed`
- [x] 1.3 依 target 更新旗標：recruiting→清空 startedAt/cancelledAt/completedAt/cancelReason；started→startedAt=now 並清 cancelled/completed/cancelReason；cancelled→cancelledAt=now、cancelReason='（管理者後台調整）'
- [x] 1.4 `revalidatePath('/admin/course-sessions')` 與 `revalidatePath('/course/${inviteId}')`，回傳 ActionResponse；不呼叫 `createNotification`

## 2. 狀態下拉元件（components/course-session/course-status-select.tsx）

- [x] 2.1 新增 client 元件 `CourseStatusSelect`，props：`inviteId: number`、`current: 'recruiting' | 'started' | 'completed' | 'cancelled'`
- [x] 2.2 下拉選項：招生中／進行中／已取消（current 預選）；`current === 'completed'` 時顯示停用的「已結業」當前項，且三選項不可改它（或整個下拉停用顯示已結業）
- [x] 2.3 `onChange` 呼叫 `setCourseStatusAdmin`，成功/失敗以 `sonner` toast 呈現，成功後 `router.refresh()`；提交中 disabled 防重複

## 3. 後台列表整合（app/(user)/admin/course-sessions/page.tsx）

- [x] 3.1 新增狀態推導工具（cancelled > completed > started > recruiting）
- [x] 3.2 每個 grid cell 改為包住 `CourseSessionCard` + 下方 `CourseStatusSelect`（傳入 inviteId 與推導 current），保留卡片 `newTab` 連結行為

## 4. 驗證

- [x] 4.1 `npm run build` 通過（✓ Compiled successfully，`/admin/course-sessions` 正常編譯）
- [ ] 4.2 手動驗證：admin 於 `/admin/course-sessions` 變更某課程狀態（招生中↔進行中↔已取消）即時反映；已結業課程下拉停用無法改；一般使用者呼叫被拒 —需在執行中的環境手動驗證

## 5. 規範同步（依 CLAUDE.md）

- [x] 5.1 `config/version.json` patch +1
- [x] 5.2 重新產生 `README-AI.md`（架構樹 admin/course-sessions 說明、任務日誌）
- [x] 5.3 更新 `doc/管理者操作手冊.md`〈開課管理〉章節，新增「後台變更課程狀態」說明（可選狀態、不含已結業、不發通知）

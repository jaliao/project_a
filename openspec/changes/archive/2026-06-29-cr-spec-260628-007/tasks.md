## 1. 結業資訊區塊權限調整

- [x] 1.1 在 `app/(user)/course/[id]/page.tsx` 匯入 `canTeachAny`（`@/lib/auth-roles`）
- [x] 1.2 計算可見性旗標 `canViewGraduation = canTeachAny(userSession.user.roles)`
- [x] 1.3 將結業資訊區塊顯示條件由 `isCompleted && courseSession.completedAt` 改為再 `&& canViewGraduation`

## 2. 驗證

- [x] 2.1 管理者（admin／superadmin）進入已結業課程：顯示結業資訊區塊（由 `canTeachAny` 邏輯保證）
- [x] 2.2 講師（teacher_1／2／3）進入已結業課程：顯示結業資訊區塊（由 `canTeachAny` 邏輯保證）
- [x] 2.3 一般會員／已報名學員進入已結業課程：不顯示結業資訊區塊（由 `canTeachAny` 邏輯保證）
- [x] 2.4 `npm run lint`（0 errors）與 `npm run build`（✓ Compiled successfully）通過

## 3. 文件與版本

- [x] 3.1 更新 `doc/學員手冊.md`（學員不再見結業資訊區塊）
- [x] 3.2 更新 `doc/老師手冊.md` 與 `doc/管理者操作手冊.md` 相關章節
- [x] 3.3 各手冊檔首版本標註與日期更新；`config/version.json` patch +1（→ 0.1.97）

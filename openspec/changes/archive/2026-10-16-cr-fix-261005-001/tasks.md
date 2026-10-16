## 1. Server Action 錯誤處理

- [x] 1.1 `app/actions/admin.ts`：`deleteMember` 的 `prisma.$transaction(...)` 呼叫包上 `try/catch`，catch 到 `Prisma.PrismaClientKnownRequestError` 且 `code === 'P2003'` 時，依約束名稱對照訊息表回傳 `{ success: false, message: '...' }`；非 `P2003` 的例外維持原本往上拋
- [x] 1.2 建立約束名稱對照表（涵蓋 `invite_enrollments_inviteId_fkey`、`course_invites_createdById_fkey`、`conversations_createdById_fkey`、`conversation_messages_authorId_fkey`、`course_messages_authorId_fkey`），未命中時回傳通用 fallback 訊息並 `console.error` 記錄完整約束名稱與原始錯誤供後續排查
- [x] 1.3 實作前**務必**在本機/測試環境實際觸發一次 P2003，確認 `error.meta` 實際格式：**已實測，發現兩個與原設計不符之處並已修正**：
  1. `error.meta` 並非官方文件舊版描述的 `{ field_name }`，而是 `{ modelName, driverAdapterError: { cause: { constraint: { index } } } }`（本專案用 `@prisma/adapter-pg`）——已新增 `extractFkConstraintName` 處理此巢狀結構。
  2. 還原本次事件真實情境（講師開的班級下還有其他學員報名）實測後，實際觸發的約束是 `invite_enrollments_inviteId_fkey`，不是原本假設的 `course_invites_createdById_fkey`——已修正對照表的 key，並補測「班級無其他學員」情境確認不會誤判擋下。

  驗證方式：於本機 `docker compose exec web` 容器內（連到 project_a 自己的 dev DB）建立暫存測試帳號、班級、報名記錄，執行與 `deleteMember` 完全相同的 `$transaction` 邏輯驗證。**注意**：不可直接從 host 用 `.env` 的 `DATABASE_URL_DEV`（`127.0.0.1:5432`）連線——project_a 的 `docker-compose.yml` 中 `db` 服務未對外 publish port，host 的 5432 實際被另一個專案（bc-erp）的容器占用，直接連會連到錯誤的資料庫且不會有明顯錯誤提示，必須透過 `docker compose exec web` 走容器內部網路。測試資料皆已清除（最後以 `user.findMany({ email contains '@example.invalid' })` 確認殘留數量為 0）

## 2. 前端驗證（不預期需要改動程式碼）

- [x] 2.1 確認 `components/admin/member-delete-button.tsx` 既有的 `result.success` 分支與 `toast.error(result.message ?? ...)` 邏輯不需修改（已確認：`deleteMember` 現在會正確回傳 `{ success: false, message: FK_RESTRICT_MESSAGES[...] }`，前端無需改動）

## 3. 驗證

- [x] 3.1 `npx tsc --noEmit` 與 `npm run build` 皆成功，無編譯錯誤
- [x] 3.2 模擬「講師帳號班級下仍有其他學員報名記錄」情境（還原 PA260267 原始事件），執行與 `deleteMember` 相同的交易邏輯，確認回傳具體中文原因（「無法刪除：此會員是某個班級的建立者（講師）…」）、會員未被刪除、交易正確回滾。**此為 Server Action / Prisma 交易層級驗證，非瀏覽器 UI 實際操作**（容器內無瀏覽器、也無現成管理者登入 session 可用）——前端顯示正確性已由 2.1 的程式碼邏輯確認（`toast.error(result.message)` 會原樣顯示這裡驗證過的訊息字串），但未實際在瀏覽器點擊過一次，建議人工於瀏覽器補驗收一次
- [x] 3.3 模擬「會員曾發起站內對話」情境，確認回傳對應的具體訊息（`conversations_createdById_fkey` → 對話發起人訊息）。同上，為 Server Action 層級驗證，非瀏覽器操作
- [x] 3.4 確認一般正常刪除（無任何關聯資料擋住）與「班級由該會員建立但無其他學員報名」兩種情境皆能正常刪除成功（`{ success: true, message: '會員已刪除' }`），不會被新增的錯誤處理誤判擋下。同上，為 Server Action 層級驗證；`router.push('/admin/members')` 與成功 toast 的實際畫面效果未改動既有邏輯，理論上不受影響，但未實際於瀏覽器確認
- [x] 3.5 確認非 FK 約束類型的例外（實測以 P2025「記錄不存在」模擬）不會被誤判為 FK 錯誤，維持原本判斷邏輯會將其往上拋（未在此對照表命中時走 `throw error` 分支）

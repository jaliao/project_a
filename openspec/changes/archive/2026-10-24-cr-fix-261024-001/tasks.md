## 1. 共用檢查

- [x] 1.1 新增 `lib/data/teacher-eligibility.ts`，匯出 `hasGraduatedBook(userId: string, courseCatalogId: number): Promise<boolean>`（查 `InviteEnrollment.graduatedAt` 非空且 `invite.courseCatalogId` 相符）

## 2. Server Actions（`app/actions/admin.ts`）

- [x] 2.1 `grantTeacherRole`：新增身分前呼叫 `hasGraduatedBook`，未通過回傳 `{ success: false, message: '此會員尚未結業《{書名}》，無法授予此講師身分' }`（書名用 `BOOK_LABEL_BY_TEACHER_ROLE`）
- [x] 2.2 `updateMemberRoles`：既有 `changed` 迴圈中，對「新增且為 `TeacherRole`」者加入同樣的 `hasGraduatedBook` 檢查，未通過回傳同款錯誤訊息
- [x] 2.3 `createMemberSchema` 的 `roles` 列舉改為僅 `['admin', 'superadmin']`
- [x] 2.4 `lib/auth-roles.ts` 新增 `ASSIGNABLE_ROLES_ON_CREATE = ['admin', 'superadmin']` 常數（`ASSIGNABLE_ROLES` 本身不變）

## 3. 前端

- [x] 3.1 `components/admin/create-member-dialog.tsx` 身分勾選清單改用 `ASSIGNABLE_ROLES_ON_CREATE`

## 4. 驗證

- [x] 4.1 驗證：`createMemberSchema` 對 `roles: ['teacher_1']` 回傳驗證失敗、對 `['admin']`/`[]` 通過（zod schema 直接測試）
- [x] 4.2 驗證：於本機 dev 資料庫以真實資料呼叫 `hasGraduatedBook(未結業 book1 之會員, 1)` 回傳 `false`，確認 `grantTeacherRole`/`updateMemberRoles` 會在此條件下拒絕授予
- [x] 4.3 驗證：於本機 dev 資料庫以真實資料呼叫 `hasGraduatedBook(已結業 book1 之會員, 1)` 回傳 `true`，確認授予邏輯在此條件下會放行（寄信與 `roles` 更新為既有未變更邏輯，不在本次變更範圍）
- [x] 4.4 實際點擊驗證：Justin 於 dev 環境確認「新增會員」對話框已無講師身分選項（並已加上說明文字）、「講師身分分頁」卡片式授予/拒絕行為正常。「會員身分編輯」查無對應畫面——查明其元件 `components/admin/member-roles-editor.tsx` 從未被任何頁面引用（孤兒元件，非本次變更造成），已確認刪除；現場唯一會呼叫 `updateMemberRoles` 的是「特殊設定」分頁（`MemberSpecialRoles`），僅處理 `admin`/`superadmin`，不受本次結業檢查影響（`updateMemberRoles` 中新增的講師身分檢查暫無 UI 觸發路徑，但作為 Server Action 輸入邊界防呆予以保留）
- [x] 4.5 `npm run lint` 與 `npm run build` 通過

## 5. 歷史資料修正（一次性，不產生程式邏輯變更）

- [x] 5.1 盤點正式環境所有「教師集合」成員（`CourseInvite.createdById` 曾使至少一人於任一書結業者，涵蓋 catalogId 1/2/3），逐一確認本人是否已有對應書籍的結業紀錄。結果：catalog 1（啟動靈人）教師集合 178 人、catalog 2（啟動豐盛）10 人、catalog 3（啟動得勝）0 人；完全沒有自己結業紀錄者（真正根節點異常）catalog 1/2 皆僅黃國倫（合法創始人，seed 帳號），catalog 3 無人；另有 8 人屬「自己結業時間晚於帶出學生」的時序異常（含盧正義、陳正明），但師徒鏈本身正確，不視為需修正的資料錯誤
- [x] 5.2 盧蔡美玲已由 Justin 於本次 CR 討論前手動補一筆結業紀錄修正，盤點確認其已從異常清單消失；除此之外**未發現其他需要修正的異常帳號**，本次無需額外資料修正
- [x] 5.3 全量（不限某月 cutoff）重新查詢 `generations()` 邏輯，確認「第 0 代」僅剩黃國倫一人（教師集合共 178 人）

## 6. 文件同步

- [x] 6.1 依 CLAUDE.md 第 9 點，檢查並更新 `doc/管理者操作手冊.md`（版本標頭、「新增會員」不提供講師身分選項說明、「講師身分」授予前置結業檢查說明、情境 B 操作步驟改寫）；`doc/老師手冊.md`、`doc/學員手冊.md` 檢查後確認無相關內容需改動
- [x] 6.2 `config/version.json` patch 版本號 +1 為 `0.1.234`，`updatedAt` 更新為 `2026-10-24`；`README-AI.md` 索引版本號同步更新
- [x] 6.3 依 CLAUDE.md 第 8 點更新 `ai-context/05-business-logic.md`（新增「講師身分授予前置檢查」小節）與 `ai-context/07-current-tasks.md`（「已完成」清單最前面附加本次 CR 紀錄）

## 7. 孤兒元件清理（本次驗證過程中發現，Justin 確認處理）

- [x] 7.1 刪除 `components/admin/member-roles-editor.tsx`（從未被任何頁面引用的孤兒元件）；`npm run lint`、`npm run build` 皆通過

# Tasks: cr-spec-260717-001 課程頁新增學員改為僅限既有會員

## 1. 資料層（`lib/data/invite-students.ts`）

- [x] 1.1 新增 `findMemberByIdentifier(identifier: string)`：含 `@` 視為 Email（trim+lowercase 精確比對），否則視為啟動編號（`spiritId` trim 精確比對）；回傳型別沿用 `MemberByEmail`（可重新命名為 `MemberByIdentifier`）
- [x] 1.2 移除或保留 `findMemberByEmail` 供其他呼叫端使用（先 grep 確認無其他引用者再決定移除）

## 2. Server Action（`app/actions/invite-students.ts`）

- [x] 2.1 `lookupMemberByEmail` 更名 `lookupMemberByIdentifier(inviteId, identifier)`，改呼叫 `findMemberByIdentifier`；`inviteId` 課程歸屬授權邏輯不變
- [x] 2.2 `addStudentSchema` 移除 `realName`、`email` 改 `identifier`（`z.string().trim().min(1)`）
- [x] 2.3 `addStudentToInvite`：以 `findMemberByIdentifier` 查會員；查無時回傳 `{ success: false, errors: { identifier: ['查無此會員，請確認 Email 或啟動編號'] } }`，函式提早返回
- [x] 2.4 移除 `createLoginableMember` 建帳號分支與其 import；`targetSnapshot` 改用查得會員的 `realName` 與識別碼（email 或 spiritId）
- [x] 2.5 回傳型別移除 `tempPassword`/`spiritId` 資料欄位（不再有建帳號情境）；確認 revalidatePath 不變

## 3. UI（`components/admin/invite-student-cells.tsx`）

- [x] 3.1 `AddStudentDialog`：移除「姓名」輸入欄；查找欄位改「Email 或啟動編號」單一 input，placeholder 更新
- [x] 3.2 debounce 查詢改呼叫 `lookupMemberByIdentifier`；格式驗證由 email regex 改為「非空字串」
- [x] 3.3 `LookupState` 的 `'new'`（查無）分支文案改「查無此會員，請確認 Email 或啟動編號」；此狀態下送出按鈕停用
- [x] 3.4 移除 `created`（臨時密碼一次性顯示）狀態與其 UI 區塊；`handleSubmit` 成功後直接關閉 dialog
- [x] 3.5 Dialog 說明文字更新（僅限既有會員、查無請至會員管理新增）

## 4. 文件與版本

- [x] 4.1 `doc/管理者操作手冊.md`、`doc/老師手冊.md`：新增學員流程描述改為「僅限既有會員、Email 或啟動編號查找」，移除建帳號相關說明
- [x] 4.2 `config/version.json` patch +1；README-AI.md 同步

## 5. 驗證

- [x] 5.1 `npm run build` 與 `npm run lint` 通過
- [x] 5.2 手動驗證：①既有會員 Email 加入成功 ②既有會員啟動編號加入成功 ③查無會員時送出按鈕停用且提示正確 ④重複報名擋下 ⑤非該課講師無權限

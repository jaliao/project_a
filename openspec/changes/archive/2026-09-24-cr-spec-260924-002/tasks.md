## 1. 重構：抽出共用的先修訊息格式化 helper

- [x] 1.1 `lib/data/course-catalog.ts`：於 `checkPrerequisites` 旁新增 `formatMissingPrerequisites(missing: { id: number; label: string }[]): string`，回傳 `missing.map((p) => p.label).join('、')`
- [x] 1.2 `app/actions/course-invite.ts`：`applyToCourse` 既有的 `` `需先完成${missingPrereqs.map((p) => p.label).join('、')}才能加入此課程` `` 改為 `` `需先完成${formatMissingPrerequisites(missingPrereqs)}才能加入此課程` ``（純重構，訊息文字不變），並補上 import

## 2. Server Action：新增先修驗證

- [x] 2.1 `app/actions/invite-students.ts`：`addStudentToInvite` 查詢 `CourseInvite` 的 `select` 補上 `courseCatalogId: true`（現有 `select: { id, title, completedAt, cancelledAt, createdById }`）
- [x] 2.2 檔頭 import 新增 `import { checkPrerequisites, formatMissingPrerequisites } from '@/lib/data/course-catalog'`
- [x] 2.3 在「重複報名事前檢查」（`dup` 檢查，約 L166）之後、「教材選擇預設值」計算之前，新增先修驗證：
  ```ts
  const missingPrereqs = await checkPrerequisites(existingUser.id, invite.courseCatalogId)
  if (missingPrereqs.length > 0) {
    return {
      success: false,
      errors: { userId: [`需先完成${formatMissingPrerequisites(missingPrereqs)}才能加入此班級`] },
    }
  }
  ```
- [x] 2.4 確認不加任何 `isAdmin` 豁免分支——管理者與該課講師一律受此驗證限制

## 3. 驗證

- [x] 3.1 `npm run build`，確認無 TypeScript 編譯錯誤
- [x] 3.2 手動測試：`applyToCourse` 重構後行為不變——學員缺先修時報名仍被拒絕，訊息文字與重構前一致（依使用者指示跳過本機驗證，改由使用者於正式環境實測）
- [x] 3.3 手動測試：非管理者教師帳號，對已設定先修（如「啟動豐盛」）的班級，透過 StudentPicker 選定一位未結業「啟動靈人」的既有會員送出，確認回傳欄位錯誤且未建立報名（同上，改由使用者於正式環境實測）
- [x] 3.4 手動測試：管理者帳號重複上述操作，確認同樣被擋下（無管理者豁免）（同上，改由使用者於正式環境實測）
- [x] 3.5 手動測試：選定已完成先修的既有會員，確認可正常加入（既有行為不受影響）（同上，改由使用者於正式環境實測）
- [x] 3.6 手動測試：對無先修條件的班級（如「啟動靈人」）新增學員，確認不受影響、行為與現況相同（同上，改由使用者於正式環境實測）
- [x] 3.7 手動確認：先修驗證不影響 `searchStudentsForInvite` 搜尋結果與好友清單——未完成先修的學員仍可被搜尋到、被選取（同上，改由使用者於正式環境實測）

## 4. 收尾

- [x] 4.1 更新 `config/version.json` patch 版本號 +1，`updatedAt` 更新為當日日期
- [x] 4.2 檢查 `doc/管理者操作手冊.md` / `doc/老師手冊.md` 是否需補充「新增學員」段落的先修限制說明，如有異動一併更新檔首版本與日期（`doc/學員手冊.md` 檢查後判定學員視角無異動，未更動）
- [x] 4.3 更新 `README-AI.md` 對應章節（`ai-context/`）反映本次業務邏輯異動

## 1. 前端

- [x] 1.1 `app/[locale]/(user)/course/[id]/approved-students-section.tsx`：引入 `next/link`
- [x] 1.2 學員卡片 `<li>` 改為：當 `!removeMode && s.spiritId` 時，以 `Link`（`href="/user/${s.spiritId.toLowerCase()}"`、`target="_blank"`、`rel="noopener noreferrer"`）包裹卡片內容並加上 hover 樣式提示可點擊；否則維持原 `<li>` 純顯示
- [x] 1.3 確認移除模式（`removeMode = true`）下卡片維持不可點擊，「移除」按鈕可正常操作不受連結影響
- [x] 1.4 確認 `spiritId` 為 `null` 的卡片不產生連結
- [x] 1.5 `lib/data/course-sessions.ts`：`getCourseSessionById` 的 `enrollments.select.user` 新增 `gender: true, churchType: true, churchOther: true, church: { select: { name: true } }`；`EnrollmentRecord.user` 型別同步擴充
- [x] 1.6 `app/[locale]/(user)/course/[id]/page.tsx`：組裝 `students` prop 時新增 `gender: enrollment.user.gender`，並比照 `user/[spiritId]/page.tsx` 的教會三態判斷就地算出 `churchLabel: string | null`（`churchType === 'church' ? church?.name ?? null : churchType === 'other' ? churchOther ?? null : null`）一併傳入
- [x] 1.7 `approved-students-section.tsx`：`ApprovedStudentItem` 型別新增 `gender: Gender`（`@/components/shared/gender-icon` 的型別）與 `churchLabel: string | null`
- [x] 1.8 卡片內容新增顯示：`gender !== 'unspecified'` 時於姓名後顯示 `GenderIcon`（僅圖示，不加文字標籤）；`churchLabel` 非空時於**姓名列上方**顯示該文字（純文字，不加前綴標籤）；兩者皆為空/未指定時不渲染對應元素

## 2. 驗證

- [x] 2.1 手動驗證：一般學員於課程詳情頁點擊任一已核准學員卡片，於新分頁開啟該學員會員首頁
- [x] 2.2 手動驗證：管理者／該課講師於非移除模式下點擊卡片，行為一致
- [x] 2.3 手動驗證：切換至移除模式後，卡片不可點擊，移除按鈕操作不受影響
- [x] 2.4 手動驗證：`spiritId` 為 null 的學員（如有）卡片不可點擊
- [x] 2.5 手動驗證：已設定性別的學員卡片顯示對應 `GenderIcon`；`unspecified` 的學員卡片不顯示性別圖示
- [x] 2.6 手動驗證：已設定教會（`church` 關聯或 `churchOther` 自填）的學員卡片顯示教會文字；`none` 的學員卡片不顯示該行
- [x] 2.7 `npm run lint` 與 `npm run build` 通過

## 3. 文件同步

- [x] 3.1 依 CLAUDE.md 第 9 點，檢查並更新 `doc/管理者操作手冊.md`／`doc/老師手冊.md`／`doc/學員手冊.md`（已核准學員卡片新增可點擊連到會員首頁、顯示性別圖示／所屬教會說明）
- [x] 3.2 `config/version.json` patch 版本號 +1（0.1.232 → 0.1.233），`updatedAt` 維持當日日期；三份手冊檔首版本標註同步更新
- [x] 3.3 依 CLAUDE.md 第 8 點更新 `ai-context/` 有異動的章節檔（`07-current-tasks.md` 已完成清單最前新增本次 CR 記錄）與 `README-AI.md` 版本行

## Why

`/course/[id]` 課程詳情頁的「已核准學員」卡片目前純顯示（姓名、教材選擇、加入時間），無法快速查看該學員的會員首頁（`/user/<spiritId>`），也看不到該學員的性別、所屬教會。管理者於後台會員列表已有「會員首頁」快捷按鈕（`admin-member-management` 的「會員首頁快捷入口」），課程詳情頁卻沒有對應入口，講師、管理者甚至一般學員想看某位同學的個人首頁時，只能自己去後台或猜網址；同時講師／管理者也常需要知道班上學員的性別、所屬教會分佈，目前只能逐一點進每位學員首頁查看。

## What Changes

- 課程詳情頁「已核准學員」卡片（`ApprovedStudentsSection`）改為可點擊，點擊整張卡片導向該學員的會員首頁 `/user/<spiritId 小寫>`（比照 `components/admin/member-home-link.tsx` 的連結模式），新分頁開啟。
- 可見與可點擊範圍：與卡片本身目前的可見範圍一致——**任何登入後能開啟此課程詳情頁的使用者**皆可點擊任一已核准學員卡片（不限管理者／該課講師）。此決定基於兩個既有事實：①「已核准學員」卡片清單本身並未依身分限制顯示；②連結目標頁 `/user/[spiritId]` 本身也沒有任何權限守衛（任何登入者皆可開啟任一會員的首頁）。因此新增此連結不會造成新的資料外露範圍。
- 移除模式（`removeMode`，僅管理者／該課講師可進入）下，卡片維持**不可點擊**（避免整卡 `<a>` 與卡內「移除」按鈕巢狀互相干擾），行為與目前移除模式的操作焦點一致。
- `spiritId` 為 `null`（理論上已核准學員必有帳號與 spiritId，此為防呆）時卡片維持不可點擊，不產生連結。
- 卡片新增顯示該學員的**性別**（僅圖示，緊接於姓名後，沿用 `components/shared/gender-icon.tsx` 的 `GenderIcon`，`unspecified` 時不顯示任何圖示）與**所屬教會**（純文字，置於**姓名列上方**，依 `churchType` 三態解析成教會名稱／自填文字；`none` 或無對應文字時不顯示該行）。可見範圍與卡片現有資訊一致：所有能開啟此課程詳情頁的登入使用者皆可見，不限管理者／該課講師。

## Capabilities

### Modified Capabilities
- `course-session-detail`：「已核准學員清單」Requirement 新增「卡片可點擊連到會員首頁」與「卡片顯示性別圖示／所屬教會文字」兩項行為。

## Impact

- **前端**：`app/[locale]/(user)/course/[id]/approved-students-section.tsx` 的學員卡片 `<li>` 改用 `next/link` 包裹（比照 `member-home-link.tsx` 的 `target="_blank" rel="noopener noreferrer"`），僅於 `!removeMode && s.spiritId` 時啟用連結；卡片內容新增性別圖示（`GenderIcon`，`unspecified` 時不渲染）與所屬教會文字（無資料時不渲染該行）。
- **資料層**：`lib/data/course-sessions.ts` 的 `getCourseSessionById` 在 `enrollments.select.user` 新增 `gender`、`churchType`、`churchOther`、`church: { select: { name: true } }`；`EnrollmentRecord.user` 型別同步擴充。
- **呼叫端**：`app/[locale]/(user)/course/[id]/page.tsx` 組裝 `students` prop 時，比照 `user/[spiritId]/page.tsx` 既有的教會三態就地判斷邏輯，算出 `churchLabel`（無共用 helper 可重用，此為既有重複模式的第三處，非本次新增範圍）一併傳入 `gender`。
- 不涉及 Server Action、資料庫 schema 或權限判定變更（沿用既有已暴露的資料範圍；`gender`/`churchType`/`churchOther`/`church` 欄位已存在於 `User`/`Church` model）。

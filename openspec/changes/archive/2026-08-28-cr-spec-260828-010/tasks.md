## 1. 資料層

- [x] 1.1 `lib/data/learning-study.ts` 新增 `getLearningProgressByCatalog(userId): Promise<Record<number, { done: number; total: number }>>`：`import { getCatalogOutline, getOutlineCatalogIds, isLessonCompleted } from '@/config/learning-outline'`；對 `getOutlineCatalogIds()` 每個 id，`filledSlots = await getFilledOutlineSlots(userId, id)`、`total = outline.lessons.length`、`done = outline.lessons.filter(l => isLessonCompleted(l, filledSlots)).length`；僅回傳有大綱的目錄。**複用 CR-007 既有函式，不另立完成度演算法**

## 2. 元件改寫

- [x] 2.1 `components/learning/course-progress-cards.tsx`：props 擴充 `inProgressCatalogIds: number[]`、`progressByCatalog: Record<number, {done,total}>`、`spiritId: string`、`isOwnPage: boolean`；`import Link from 'next/link'`；維持 server component、寫死繁體
- [x] 2.2 每張卡計算：`cert = certByCatalogId.get(id)`、`isInProgress = inProgressCatalogIds.includes(id)`、`progress = progressByCatalog[id]`、`linkable = isOwnPage && (!!cert || isInProgress) && progress != null`
- [x] 2.3 三態渲染：已完成（`IconCircleCheck` text-primary、`border-primary/30 bg-primary/5`、學業完成時間＋`{cert.title} · {cert.teacherName}`）／進行中（`IconCircleDotted` text-blue-600、`border-blue-500/40`、「進行中」）／未完成（`IconCircleDashed` muted、`border-dashed text-muted-foreground`、「未完成」）
- [x] 2.4 完成度列：`progress != null` 且（已完成 或 進行中）→ `已完成 {progress.done} / 共 {progress.total} 課`（`pl-6 text-xs text-muted-foreground`）；未完成卡不顯示
- [x] 2.5 外層容器：`linkable` → `<Link href={/user/${spiritId}/learning/${id}} className="{基礎樣式} hover:bg-muted/40 transition-colors">`＋標題列右側 `IconChevronRight`（`h-4 w-4 text-muted-foreground`）；否則 `<div>`。grid `grid grid-cols-1 gap-3 sm:grid-cols-3` 不變

## 3. 頁面資料計算

- [x] 3.1 `app/[locale]/(user)/user/[spiritId]/page.tsx`：`import { getLearningProgressByCatalog } from '@/lib/data/learning-study'`
- [x] 3.2 `certByCatalogId` map；`inProgressCatalogIds` = `enrollments`（既有、已排除 cancelled）過濾 `e.status === 'approved' && e.startedAt != null` 取 distinct `courseCatalogId`，再 `.filter(cid => !certByCatalogId.has(cid))`
- [x] 3.3 `const progressByCatalog = await getLearningProgressByCatalog(user.id)`（本人他人皆算）
- [x] 3.4 `<CourseProgressCards allCourses={allCourses} certificates={certificates} inProgressCatalogIds={inProgressCatalogIds} progressByCatalog={progressByCatalog} spiritId={id} isOwnPage={isOwnPage} />`

## 4. 驗證

- [x] 4.1 `npm run lint`：0 errors（16 個既有 warning，皆非本次）
- [x] 4.2 `npx tsc --noEmit` 0 errors；`npm run build`：`✓ Compiled successfully`、107/107 頁
- [x] 4.3 dev 站實測（`student1@test.com` = PA269001，啟動靈人 approved 但**未開課**、0 筆分段查經）：`GET /user/pa269001` **200**、「學習進度」區塊三卡皆為「未完成」樣式、無完成度列、無 `/learning/N` 連結——與資料一致。「已完成／進行中／可點」路徑待有結業＋進度的可登入帳號人工實測（dev 無此帳號密碼）
- [ ] 4.4 **待人工實測**：同一目錄，首頁三卡「已完成 X/Y」= 該書籍子頁頂部「已完成 X/Y」（同 `isLessonCompleted` 口徑——程式碼層已由「共用同一函式」保證）
- [ ] 4.5 **待人工實測**：他人視角三卡狀態與作業完成度可見、卡片不可點（`linkable` 含 `isOwnPage` 已保證無 `<a>`）
- [x] 4.6 得勝（無大綱）：`getLearningProgressByCatalog` 只回傳 `getOutlineCatalogIds()`（`[1,2]`）→ 得勝 `progress` 為 undefined → `linkable` 為 false、不顯示完成度列（程式碼保證；student1 頁面得勝卡亦為純未完成卡）
- [x] 4.7 迴歸：`/user/pa269001` 200、首頁其餘區塊正常渲染；`build` 通過、CR-007 的「我的學習」兩層頁面與 `config/learning-outline.ts` 未動

## 5. 文件與版本號同步

- [x] 5.1 `doc/學員手冊.md`「學習進度（個人首頁基本資料）」小節：改為三態（未完成／進行中／已完成）＋「作業完成度『已完成 X / 共 Y 課』與『我的學習』一致」＋「本人視角進行中／已完成可點進『我的學習』、他人不可點」；檔首 v0.1.182 → v0.1.183（2026-08-29）
- [x] 5.2 `doc/老師手冊.md`：唯一提及「課程進度卡顯示學業完成時間」一句於三態下仍成立，不需改；`doc/管理者操作手冊.md` 無涉及
- [x] 5.3 `config/version.json`：`0.1.182` → `0.1.183`，`updatedAt` → `2026-08-29`

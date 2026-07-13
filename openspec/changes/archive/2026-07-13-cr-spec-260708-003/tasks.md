# Tasks — 課程頁面字體大小標準化（cr-spec-260708-003）

## 1. 區塊標題標準化（icon＋text-base font-semibold）

- [x] 1.1 `page.tsx`：課程基本資訊（IconInfoCircle）、結業資訊（IconCertificate，icon 用 text-green-700、標題移除 text-green-800）、已核准學員（IconUsers）三處標題套標準
- [x] 1.2 `course-detail-actions.tsx`：`Section` 元件加選用 `icon` prop、h3 改 text-base font-semibold；三區塊帶入 IconBook／IconPlayerPlay／IconBan
- [x] 1.3 其餘區塊元件標題套標準：待審申請（PendingEnrollmentList）、公開媒合（MatchSettingsEditor）、學員申請區（StudentApplySection）——icon 依語意選用，以 @tabler/icons-react 實際存在者為準

## 2. FAQ 與內文字級

- [x] 2.1 `components/course-faq/course-faq.tsx`：標題改 icon（IconMessageCircle）＋text-base font-semibold；檢查提問/回覆內文 text-sm、作者 text-sm font-medium、時間戳 text-xs，收斂不一致處
- [x] 2.2 走查課程頁各區塊內文/輔助字級，收斂為內文 text-sm、輔助 text-xs muted（僅樣式、不動結構與 key）

## 3. 版本與文件

- [x] 3.1 `config/version.json` patch +1＋updatedAt（純樣式，手冊免改）
- [x] 3.2 依 `.ai-rules.md` 更新 `README-AI.md`

## 4. 驗證

- [x] 4.1 `npm run lint` 與 `npm run build` 通過
- [x] 4.2 手動驗證：課程頁八類區塊標題皆 icon＋粗體、FAQ 字級與其他區塊一致、手機版顯示正常

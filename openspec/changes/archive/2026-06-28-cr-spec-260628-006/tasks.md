## 1. 門檻判定

- [x] 1.1 `lib/utils/course-start-gate.ts`：`evaluateCourseStartGate` 簽章改為 `{ approvedCount, remaining, orders }`；移除 `orders.length===0` 硬擋
- [x] 1.2 新增原因：`remaining.traditional + remaining.simplified > 0` → 「尚有教材未申請（繁 X、簡 Y）」；保留「尚無已核准學員」與「教材訂單尚未全部收件」

## 2. 呼叫端

- [x] 2.1 `app/(user)/course/[id]/page.tsx`：將 `materialProgress.remaining` 傳入 `evaluateCourseStartGate`
- [x] 2.2 `app/actions/course-invite.ts` `startCourseSession`：以 `getEnrollmentMaterialSummary` + 訂單繁/簡加總（`computeMaterialProgress`）算出 remaining 後傳入門檻判定

## 3. 驗證

- [x] 3.1 `npm run build` 通過
- [x] 3.2 手動驗證：訂單收件後新增選書學員 → 按鈕停用且顯示「尚有教材未申請」
- [x] 3.3 手動驗證：全班不需教材（無訂單）→ 可開課
- [x] 3.4 手動驗證：需求全申請且全收件 → 可開課；server 端拒絕繞過

## 4. 文件與版本

- [x] 4.1 `doc/老師手冊.md` 開課門檻說明補上「尚有教材未申請」與「全班不需教材可開課」；更新檔首版本與日期
- [x] 4.2 `config/version.json` patch +1
- [x] 4.3 更新 `README-AI.md`（開課門檻納入尚未申請=0）

## Context

個人頁 `app/[locale]/(user)/user/[spiritId]/page.tsx` 目前的「學習紀錄」區塊（`isOwnPageEarly` 才顯示）由 `LearningRecordsPanel`（`components/learning/feedback-entry.tsx`）渲染，資料來自 `getMyLearningFeedbacks`（`lib/data/learning-feedback.ts`）與自製的 `LearningRecord[]`。同一套資料模型（`LearningFeedback`）另外驅動後台 `/admin/learning-feedback` 管理頁與 `admin/page.tsx` 儀錶板的待處理計數卡片。

「聯繫管理者」（`contact-admin`）已上線且資料層完備：`lib/data/support-inquiry.ts` 的 `getMyInquiries(userId)` 回傳該學員全部 `SupportInquiry`（依 `createdAt desc`），供 `/user/{spiritId}/inquiries` 頁面使用。本次設計即是把「學習紀錄」區塊的資料來源與畫面，從 `LearningFeedback` 全面切換到既有的 `SupportInquiry`／`getMyInquiries`。

## Goals / Non-Goals

**Goals:**
- 移除學員自助回報學習歷程的整套 UI 與表單（結業狀態卡片、一鍵回報、回饋歷程清單）。
- 個人頁「學習紀錄」區塊改顯示本人最近 3 筆聯繫管理者提問＋「看更多」導向 `/user/{spiritId}/inquiries`。
- 移除 `learning-record-feedback` capability 對應的所有前後台程式碼（component、action、data、schema、admin 頁面、admin 儀錶板引用、i18n 命名空間）。
- 停止對 `LearningFeedback` 資料表的一切讀寫。

**Non-Goals:**
- 不刪除 `LearningFeedback` Prisma model／不建立刪表 migration（正式環境既有資料保留供未來查詢）。
- 不變動 `contact-admin` 既有的 `/user/{spiritId}/inquiries` 頁面本身的行為（送出表單、完整清單邏輯不變），僅新增個人頁的「最近 3 筆」嵌入點。
- 不新增分頁或「最近 N 筆」的專屬 API／查詢參數；沿用 `getMyInquiries` 全量查詢後於呼叫端 `slice(0, 3)`（提問量對單一學員而言不具分頁效能疑慮）。

## Decisions

1. **資料層沿用 `getMyInquiries`，不新增查詢函式**
   個人頁只需最近 3 筆，直接呼叫既有 `getMyInquiries(userId)` 後 `slice(0, 3)`。單一學員的提問筆數不會大到需要資料庫層 `take: 3`，避免為此新增函式簽章／參數的維護成本。

2. **`LearningRecordsPanel` 整個移除，不做「保留骨架、抽換內容」的折衷**
   結業狀態卡片與一鍵回報是同一元件內耦合的邏輯（`openReport` 預帶課程/老師到回饋表單），既然回饋表單本身要移除，保留卡片但拔掉回報入口會留下不完整的殘功能。改為在個人頁「學習紀錄」區塊直接渲染一個新的輕量元件（顯示最近 3 筆提問 + 看更多按鈕），沿用 `/user/{spiritId}/inquiries` 頁面既有的卡片視覺（狀態徽章、回覆內容）以維持一致性。

3. **`LearningFeedback` 資料表保留、程式碼全刪**
   正式環境已有歷史回饋資料（`pending`/`approved`/`rejected`）。刪表 migration 會造成資料永久遺失且無法回復；保留表格但移除所有讀寫路徑，對 Prisma schema／migration 而言是零風險的選擇（多一張未使用的表，不影響現有功能）。日後若需封存或清除，屬另一個獨立的資料治理任務，不在本次變更範圍內。

4. **後台儀錶板「學習歷程回饋」快捷卡片與待處理計數一併移除**
   `admin/page.tsx` 目前對 `getPendingFeedbackCount()` 的呼叫與對應卡片、`/admin/learning-feedback` 連結，隨功能一起下架；避免留下指向已刪除頁面的死連結。

5. **i18n：`learningFeedback` 命名空間整包移除**
   `messages/zh-TW.json`／`en.json`／`zh-CN.json` 中的 `learningFeedback` key 全數刪除；不保留供未來復用（若日後重啟此功能，屬新變更重新設計文案）。

## Risks / Trade-offs

- **[風險] 學員原本用「一鍵回報未結業」快速反映問題，改用聯繫管理者提問流程多一步（需自行選分類、輸入內容）** → 緩解：`contact-admin` 提問表單已支援「課程問題」分類，且個人頁新嵌入的最近 3 筆入口降低學員找不到入口的機率；此為使用者已確認接受的產品決策（整段移除，不做預帶欄位相容）。
- **[風險] `LearningFeedback` 資料表保留但程式碼刪除後，若未來誤刪 Prisma schema 定義會連帶影響既有資料** → 緩解：本次變更明確不動 `prisma/schema/*.prisma`，僅刪應用層程式碼；schema 檔案本身不在變更範圍。
- **[風險] 後台管理者失去「學習歷程回饋」審核入口，若有既有 `pending` 資料未處理完畢會被遺留在資料庫中無介面可查** → 緩解：屬使用者已確認接受的取捨（保留資料表不刪，供未來如需查詢時可直接以 `make db-shell`／Prisma Studio 檢視，非本次變更需提供介面）。

## Migration Plan

1. 個人頁：改用 `getMyInquiries` 取代 `getMyLearningFeedbacks` / `getMyLearningRecords`（結業狀態卡片一併移除，不需 `LearningRecord` 型別），新增最近 3 筆 + 看更多顯示元件。
2. 移除程式碼（component／action／data／schema／admin 頁／admin 儀錶板引用／i18n）。
3. `npm run lint` + `npm run build` 確認無殘留 import／死連結。
4. 依 CLAUDE.md 規範同步更新 `doc/學員手冊.md`、`doc/管理者操作手冊.md` 與 `config/version.json` patch 版號。
5. 無需 `make schema-update`（不動 Prisma schema）。

**Rollback：** 純程式碼變更（無 migration），revert commit 即可還原；`LearningFeedback` 資料未受影響。

## Open Questions

（無）

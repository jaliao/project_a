## Context

- 推薦＝`InviteEnrollment.teacherRecommended = true`（老師「講師資格回饋」填寫），另有 `teacherFeedbackNote` / `teacherFeedbackAt`。會員詳情「推薦歷程」目前唯讀顯示。
- 書籍講師身分：`TEACHER_ROLE_BY_CATALOG[catalogId]`（`lib/auth-roles.ts`）→ `teacher_1/2/3`；`User.roles` 為陣列。
- 教材訂單狀態：`getMaterialOrderStatusKey`（`lib/utils/material-order-status.ts`）→ `pending_quote`(批價)／`pending_payment`(待老師付款)／`pending_confirm`(確認款項)／`pending_ship`(出貨)。管理者待辦＝`pending_quote`/`pending_confirm`/`pending_ship`。
- 儀錶板 `admin/page.tsx` 的 `ADMIN_FEATURES` 為靜態 `description`；`AdminPage` 已是 async。

## Goals / Non-Goals

**Goals:**
- 後台 `/admin/recommendations`：列 `teacherRecommended = true`，依 `teacherFeedbackAt` 由新到舊、預設未處理；狀態推導＋「暫不接受」記錄；另開視窗看會員。
- 儀錶板卡動態副標題：推薦（未處理數）、教材（待辦數）。

**Non-Goals:**
- 本頁不指派講師身分（沿用「多重身分」頁；已成為講師為推導狀態）。
- 不改老師端回饋流程；不做 i18n。

## Decisions

1. **資料模型**：`InviteEnrollment` 新增 `recommendDeferredAt DateTime?`、`recommendDeferredById String? @db.Uuid`（關聯 `User` "RecommendDeferredBy"）、`recommendDeferralNote String?`；`User` 補反向關聯。migration `add_recommend_deferral`。
2. **狀態推導**（每筆＝一個 `teacherRecommended=true` 的 enrollment）：
   - **accepted（已成為講師）**＝ `user.roles` 含 `TEACHER_ROLE_BY_CATALOG[invite.courseCatalogId]`。
   - **deferred（暫不接受）**＝ `recommendDeferredAt != null` 且未 accepted。
   - **pending（未處理）**＝ 其餘（未 accepted、未 deferred）。
   - 優先序 accepted > deferred > pending。
3. **清單查詢**（`lib/data/recommendation.ts`）：`where teacherRecommended = true`，include user（roles＋顯示名＋spiritId）、invite（courseCatalogId、courseCatalog.label、createdBy 顯示名）、deferredBy 顯示名；`orderBy teacherFeedbackAt desc`。JS 計狀態→套 `status` 篩選（`pending` 預設／`deferred`／`accepted`／`all`）→分頁（沿現有樣式）→回 `{ items, total, totalPages, page }`。
4. **待處理推薦計數** `getPendingRecommendationCount()`：以 2 的推導計 pending 筆數（供儀錶板）。
5. **教材待辦計數** `getMaterialTodoCount()`：對每筆 `CourseOrder` 以 `getMaterialOrderStatusKey` 判定，計狀態屬 `pending_quote` / `pending_confirm` / `pending_ship` 者（與列表狀態推導一致；`pending_payment` 屬等老師付款不計）。
6. **Server Actions**（`app/actions/recommendation.ts`，`canAccessAdmin`）：
   - `deferRecommendation(enrollmentId, note)` → 設 `recommendDeferredAt=now`、`recommendDeferredById=adminId`、`recommendDeferralNote`（trim/空 null）。
   - `undeferRecommendation(enrollmentId)` → 清除三欄（回未處理）。
   - `revalidatePath('/admin/recommendations')` 與 `/admin`。
7. **頁面** `/admin/recommendations`（server component）：`searchParams { status?='pending', page? }`。欄：被推薦人（顯示名＋啟動編號）、推薦書別（catalog label）、推薦老師、回饋備註、回饋時間、狀態、（deferred 顯示備註/時間/管理者）、操作；並提供**「查看會員」另開新視窗**（`<a target="_blank">` → `/admin/members/{userId}`）。操作：pending→「暫不接受」（備註 textarea＋確認）；deferred→「取消暫不接受」；accepted→唯讀。
8. **儀錶板**：`admin/page.tsx` 計 `pendingRecommend` 與 `materialTodo`，注入對應卡片 `description`（>0 顯示提示如「有 N 筆待處理推薦」／「N 筆待批價/確認款項/出貨」，=0 用預設文字）；新增「推薦講師」卡（適當 Tabler icon → `/admin/recommendations`）。
9. 純後台、繁體（非 i18n）。

## Risks / Trade-offs

- **accepted 純推導**：若日後移除該身分，狀態自動回退 pending/deferred（符合語意）。
- **一人多推薦**（多書/多次）：以 enrollment 為單位各自一列；同書多次推薦可能多列（罕見，可接受）。
- **計數效能**：推薦與待辦訂單量小，載入後 JS 計數可接受；量大可改聚合查詢。
- 教材待辦計數與教材列表狀態務必**共用** `getMaterialOrderStatusKey`，避免定義漂移。
- migration 為新增 nullable 欄，非破壞性。

## Context

目前「新增開課」入口為 `components/course-session/course-session-dialog.tsx`，使用單一 Dialog 一次性填入所有欄位（課程選擇、日期、邀請截止日），送出後以 `createCourseSession` action 建立 CourseOrder + CourseInvite。

邀請學員僅支援「複製連結」（`invite-copy-button.tsx`），無法透過 Spirit ID 主動邀請特定學員。

身分管控目前只在 server action 層做 learningLevel 驗證，UI 沒有提前攔截非講師使用者。

## Goals / Non-Goals

**Goals:**
- 將開課流程重設計為三步驟精靈（Dialog-based，保持現有 UI 一致性）
- Step 1：卡片式課程選擇
- Step 2：基本資料（日期、預計人數）
- Step 3：預覽確認 → 開課 → 進入邀請階段
- 在精靈入口進行身分前置檢核（有結業證書 = 講師身分），`admin`/`superadmin` 豁免
- 邀請階段新增 Spirit ID 輸入 → 發送 Inbox 通知

**Non-Goals:**
- 不新增 Admin UI 來維護課程目錄（isActive / prerequisiteLevel 維持 config-driven）
- 不修改 `/invite/[token]` 公開加入流程
- 不修改 DB schema（使用現有 InviteEnrollment、Notification 結構）

## Decisions

### 1. 精靈以 Dialog 多步驟實作（非獨立頁面路由）

**決定**：在現有 Dialog 框架內以 step state（`useState<1|2|3|'invite'>`）管理步驟，不建立新的 `/course/new` 路由。

**理由**：與現有 `course-session-dialog.tsx`、`create-invite-dialog.tsx` 模式一致；避免路由跳轉中斷 Dashboard 操作情境；精靈關閉後 Dashboard 直接 revalidate。

**替代方案**：全頁路由 `/course/new` — 更適合複雜表單，但與現有模式不符，需額外處理 back navigation。

---

### 2. 身分檢核在 Client 層前置攔截

**決定**：精靈觸發前，由 Dashboard Server Component 傳遞 `canTeach: boolean` 給按鈕元件。`canTeach` 邏輯：`role === 'admin' || role === 'superadmin' || hasCertificateForLevel(selectedCourse)`。

**hasCertificateForLevel 判斷**：從 `getMyCompletionCertificates()` 查詢，若使用者有 `graduatedAt` 有值的 InviteEnrollment 對應所選課程 level，即視為具備講師身分。

**理由**：與 cr-spec-260328-001「身分標籤」使用相同數據來源，無需引入新欄位。Server action 層仍保留現有 learningLevel 驗證作為 defense-in-depth。

**行為**：`canTeach = false` 時，開課按鈕 disabled 並顯示「需具備講師身分才能開課」tooltip。

---

### 3. 課程選擇改為卡片（非 Select 下拉）

**決定**：Step 1 以 Card 元件展示開放課程（`isActive: true`），點擊即選取，選中狀態以 border/ring 樣式區分。

**理由**：課程數量少（2 門），卡片比 Select 更直覺、視覺更清晰，且可顯示課程描述與先修條件提示。

---

### 4. 邀請方式：Spirit ID → 查找 User → 發送 Inbox 通知

**決定**：新增 `inviteBySpirtId(courseInviteId: string, spiritId: string)` server action：
1. 查找 `User.spiritId === spiritId`
2. 驗證 User 存在
3. 呼叫 `createNotification(userId, '課程邀請', body)` 寫入 Inbox
4. Notification body 含課程名稱 + 邀請連結（`{origin}/invite/{token}`）

**不建立 InviteEnrollment**：通知只是告知，學員仍需自行點擊連結完成加入流程，避免繞過同意機制。

**理由**：重用現有 `createNotification` 工具；不需新增 DB 欄位；保持加入流程一致性。

---

### 5. 精靈元件拆分策略

**目錄**：`components/course-session/create-course-wizard/`

| 檔案 | 職責 |
|------|------|
| `create-course-wizard.tsx` | 精靈主容器，管理 step state、彙整表單資料 |
| `step-1-course-card.tsx` | 課程卡片選擇（展示 isActive 課程） |
| `step-2-basic-info.tsx` | 日期、預計人數表單（沿用現有欄位） |
| `step-3-preview.tsx` | 確認預覽，送出觸發 `createCourseSession` |
| `invite-step.tsx` | 邀請階段：複製連結 + Spirit ID 輸入 |

`course-session-dialog.tsx` 改為直接 render `<CreateCourseWizard />`，移除舊的 `course-session-form.tsx` 使用。

## Risks / Trade-offs

- **[Risk] 身分前置判斷時間點**：Dashboard 資料可能短暫過期（使用者剛完成結業但快取未更新）→ Mitigation：按鈕 disabled 為 soft gate，server action 仍做最終驗證；使用者可重新整理頁面取得最新狀態。
- **[Risk] Spirit ID 邀請通知被忽略**：學員收到通知但未點擊連結 → Mitigation：此為現有通知系統的固有限制，屬可接受範圍。
- **[Trade-off] 精靈在 Dialog 內**：Dialog 空間有限，三步驟若欄位增多可能擁擠 → 現階段欄位數少，暫不需全頁路由。

## Open Questions

已確認：
- Step 2 基本資料欄位與現有 `course-session-form.tsx` 相同：預計開課日期 + 邀請截止日期 + 預計人數
- 邀請階段單筆輸入即可，不需支援多人批次邀請

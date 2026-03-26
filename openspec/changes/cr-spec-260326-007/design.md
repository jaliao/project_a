## Context

目前系統有完整的 Notification model 和 Inbox UI（Drawer + 歷史頁面），但各 Server Action 成功後只呼叫 toast，不寫入 Inbox。Notification model 現有欄位（`userId`, `title`, `body`, `isRead`）已足夠儲存操作完成通知，無需 schema 變更。

需整合的關鍵操作：開課完成、取消課程、學員審核（核准/拒絕）、課程結業。

## Goals / Non-Goals

**Goals:**
- 建立 `createNotification(userId, title, body)` 內部工具函數供 actions 呼叫
- 開課完成（`createCourseSession` 成功）後自動寫入 Inbox 通知給開課教師
- 取消課程（`cancelCourseSession` 成功）後寫入通知
- 學員審核（`approveEnrollment` / `rejectEnrollment` 成功）後寫入通知給申請學員
- toast 呈現維持不變（不破壞現有 UX）

**Non-Goals:**
- 推播通知（Push Notification / Email）
- 複製連結、個人資料更新等短暫回饋操作整合 Inbox
- 通知 type/category 欄位擴充（現有欄位已足夠）
- 新增前端標準元件（工具函數已足夠，不需要新 React 元件）

## Decisions

### D1：工具函數位於 `app/actions/notification.ts`，而非 `lib/`

`createNotification` 是一個 server-side 操作（寫入 DB），放在 `app/actions/notification.ts` 與現有的 `markNotificationRead` 等函數共置，符合現有架構慣例。若放在 `lib/`，則需區分 data layer 與 mutation，造成概念混淆。

### D2：`createNotification` 為 fire-and-forget，不阻塞主操作

開課 action 的核心是建立 CourseOrder + CourseInvite transaction。通知寫入失敗不應回滾開課。因此通知呼叫在 transaction 完成後以 `try/catch` 包覆，失敗只記 console.error，不影響回傳結果。

```typescript
// 主 transaction 完成後
try {
  await createNotification(userId, '開課完成', `...`)
} catch (e) {
  console.error('通知寫入失敗', e)
}
```

### D3：通知內容為靜態文字，不引入 i18n 機制

目前系統全為繁體中文，無多語系需求，直接以中文字串組成通知標題與內容即可。

## Risks / Trade-offs

- **通知寫入失敗無法告知使用者** → Mitigation: console.error 記錄，未來可加監控
- **通知內容與 toast 文字不同步** → Mitigation: 兩者由同一個 action 控制，code review 時一起檢查
- **未來新增操作需手動整合** → Mitigation: `createNotification` 介面簡單（3 個參數），整合成本低

## Migration Plan

1. 在 `app/actions/notification.ts` 新增 `createNotification` 函數
2. 修改 `app/actions/course-session.ts` — `createCourseSession` 成功後呼叫
3. 修改 `app/actions/course-invite.ts` — `cancelCourseSession`、`graduateCourse`、`approveEnrollment` 成功後呼叫
4. 無資料庫 migration，無需 `make schema-update`

## Open Questions

- `rejectEnrollment` action 是否存在？若無則此次略過，僅整合核准流程。

## Context

CR-FEAT-261022-003 建立了 `ProxyInviteToken` 與會員詳情頁「特殊設定」分頁內的「邀請 Email」編輯/補發表單（`components/admin/member-proxy-invite-form.tsx`，由 `app/[locale]/(admin)/admin/members/[id]/page.tsx` 於 `isProxyMember` 為真時嵌入特殊設定分頁），且兩個 Server Action（`updateProxyInviteEmail`／`resendProxyInvite`，`app/actions/admin.ts`）皆 `canAccessAdmin`-only。

與使用者再次確認後，目標調整為：
1. 第一線負責代填學員的授課老師應能自行編輯邀請 Email、補發邀請，不必每次請管理者代勞。
2. 操作入口應放在**該學員自己的會員首頁**（`/user/{spiritId}`），而不是後台會員詳情頁——因為老師平常是透過課程詳情頁的學員卡片（見 CR-FEAT-261023-002）或自己班級名單找到學員，直接點進該學員首頁操作最順手。
3. 後台會員詳情頁仍保留「邀請紀錄」唯讀列表供管理者稽核，但移除編輯表單（編輯動作統一在會員首頁發生）。
4. 一旦該學員完成註冊，會員首頁上的邀請管理區塊即應自動消失（沒有繼續邀請的意義）；後台的歷史紀錄則永久保留，不隨完成註冊而隱藏。

`/user/[spiritId]` 由 `student-profile-page` capability 管理，目前對任何登入者都無存取限制（任何登入者皆可開啟任一會員首頁，見 CR-FEAT-261023-002 的既有事實調查），且該頁面**已完成 i18n 化**（見其「個人首頁在地化」Requirement：SHALL NOT 於元件寫死中文字串）。這與後台 admin 頁面（維持繁體中文 hardcoded）的既有規範不同，因此新區塊的靜態文案（標題、欄位標籤、按鈕文字）需走 i18n key；Server Action 回傳的 `message`／`errors` 維持現狀 hardcoded（依 CLAUDE.md 第 12 點「result.message 為動作層文案、非 key，維持原樣」的既有慣例）。

## Goals / Non-Goals

**Goals:**
- 讓代填學員所屬班級的授課老師能自行編輯邀請 Email、補發邀請，不需要管理者代勞。
- 操作入口移至會員首頁，且僅對授權的檢視者（管理者或該班授課老師）顯示；一般學員與無關老師看不到此區塊。
- 完成註冊後，首頁區塊自然消失；後台歷史紀錄永久可查。

**Non-Goals:**
- 不改變邀請核發的業務邏輯本身（唯一性檢查、寄信時機、30 天 TTL 皆不變）。
- 不允許受邀者（代填學員本人，尚無法登入）查詢自己的邀請歷史。
- 不處理 `/user/[spiritId]` 或課程詳情頁既有「任何登入者皆可開啟」的權限模型本身（沿用既有事實，見 CR-FEAT-261023-002 的 design.md）。
- 不處理 `admin-member-management` spec 文字「四個分頁」與實際 5 分頁的既有落差（與本次無關）。

## Decisions

### 1. 操作入口移至會員首頁，權限放寬為「管理者或該會員所屬班級的授課老師」

新增資料存取函式 `isClassTeacherOfMember(teacherId, memberId)`（`lib/data/proxy-invite.ts`）：

```ts
export async function isClassTeacherOfMember(teacherId: string, memberId: string): Promise<boolean> {
  const enrollment = await prisma.inviteEnrollment.findFirst({
    where: { userId: memberId, invite: { createdById: teacherId } },
    select: { id: true },
  })
  return !!enrollment
}
```

不限 `status`（即使該筆報名後來被取消，當初是該老師把這位代填學員加入班級，仍視為「該會員所屬班級的老師」）。

`app/actions/admin.ts` 的 `updateProxyInviteEmail`／`resendProxyInvite` 權限檢查改為：

```ts
const authorized = canAccessAdmin(session.user.roles) || await isClassTeacherOfMember(session.user.id, userId)
if (!authorized) return { success: false, message: '無權限' }
```

**Alternative considered**：開放給「任何具教師身分者」（`canTeachAny`，不查班級關聯）。與使用者確認後放棄——會讓任何老師都能改動與自己無關的代填學員登入 email，範圍過寬；且與既有「建立代填學員」的權限模式（`invite.createdById === userId` || admin，見 `app/actions/invite-students.ts`）不一致。

### 2. 會員首頁新增頂層區塊「未註冊學員邀請管理」

比照 `student-profile-page` 既有「個人首頁版面」規格（頂層區塊不帶外框卡片，直排「標題＋內容」），新增區塊置於**基本資料之後、課程之前**。顯示條件：`member.isProxyMember === true` **且**（檢視者 `canAccessAdmin` 或 `isClassTeacherOfMember(viewer.id, member.id)`）。兩個條件缺一即不渲染（包含完全不查詢授權，`isProxyMember` 為 `false` 時直接跳過，省一次查詢）。

此區塊 SHALL NOT 在檢視者為學員本人時出現特例——代填學員 `passwordHash` 為 null 無法登入，因此實務上這個區塊永遠只會被「管理者」或「該班老師」看到，不會有「本人查看自己頁面」的情境。

新增元件 `components/dashboard/proxy-invite-panel.tsx`（取代 `member-proxy-invite-form.tsx`，邏輯相同：可編輯 email 欄位＋「儲存並寄出邀請」／「補發邀請」按鈕），呼叫既有兩個 Server Action；靜態文案改用 `useTranslations('studentProfile.proxyInvite')`，新增 i18n key（`sectionTitle`／`emailLabel`／`emailPlaceholder`／`saveButton`／`resendButton`／`helperText`），`messages/zh-TW.json`／`messages/en.json` 同步新增。

`components/admin/member-proxy-invite-form.tsx` 不再被任何頁面引用，直接刪除。

### 3. 後台「未註冊會員專區」分頁簡化為唯讀歷史，不再依 `isProxyMember` 顯示/隱藏

既然編輯功能已移出後台，分頁內容單純化為「邀請紀錄」列表，**對所有會員恆顯示**（不論目前 `isProxyMember` 為何、甚至從未當過代填學員），列表為空時顯示「尚無邀請紀錄」。不再需要「此會員已完成註冊，不適用」的切換文案——因為此分頁不再有任何互動元件，單純是稽核用的唯讀歷史，完成註冊的會員一樣可以、也應該能查到自己過去的邀請歷史。

分頁順序維持「置於最前」（`proxy` → `info` → `hierarchy` → `teacher` → `special` → `inquiries`），`defaultValue` 維持 `info`。

### 4. `ProxyInviteToken.voidedAt` 獨立欄位，不覆用 `usedAt`（沿用前版決策，未變動）

```prisma
model ProxyInviteToken {
  id        String    @id @default(cuid())
  token     String    @unique
  userId    String    @db.Uuid
  email     String
  expiresAt DateTime
  usedAt    DateTime?
  voidedAt  DateTime? // 新增：補發邀請作廢時寫入，與「完成註冊使用」(usedAt) 區分
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("proxy_invite_tokens")
}
```

- `invalidatePendingTokens(userId)`：`updateMany({ where: { userId, usedAt: null, voidedAt: null }, data: { voidedAt: new Date() } })`，不再寫 `usedAt`。
- `getValidInviteToken(token)`／`getActiveInviteForToken(token)`：`where` 條件新增 `voidedAt: null`。
- `completeProxyRegistration` 寫入 `usedAt` 的邏輯不變。
- 歷史列表狀態顯示規則（`getProxyInviteHistory` 與前端元件共用）：`usedAt` 非 null → 「已完成註冊」；否則 `voidedAt` 非 null → 「已作廢」；否則 `expiresAt < now()` → 「已過期」；否則 → 「有效」。

### 5. 失效文案更新（沿用前版決策，未變動）

- `messages/zh-TW.json` `account.completeRegistration.invalidDesc`：「此邀請連結已失效或已被使用，請聯繫啟動事工同工或是授課老師重新發送邀請。」（`messages/en.json` 同步英文版本）。
- `app/actions/auth.ts` 的 `completeProxyRegistration` 兩處 hardcoded 訊息：「邀請連結已失效，請聯繫啟動事工同工或是授課老師重新發送邀請」。

## Risks / Trade-offs

- **[Risk] 授權放寬後，老師可變更自己班上代填學員的登入 email（敏感操作）。** Mitigation：範圍已收斂至「該學員實際在其班級名冊內」（`InviteEnrollment.invite.createdById` 比對），不開放給無關老師；且此操作與既有「建立代填學員」本就由老師執行的信任層級一致，未超出現有授權模型的精神。
- **[Risk] `isClassTeacherOfMember` 查詢未索引 `InviteEnrollment.userId`／`CourseInvite.createdById` 組合時可能較慢。** Mitigation：兩欄位皆為既有關聯鍵，`InviteEnrollment.userId` 與 `CourseInvite.createdById` 本身已有索引（既有 schema），此查詢屬輕量 `findFirst`，不另加複合索引。
- **[Risk] 既有 `usedAt` 查詢散落多處，遺漏某處未同步加 `voidedAt` 條件會導致已作廢的 token 被誤判有效。** Mitigation：`voidedAt` 僅影響 `getValidInviteToken`／`getActiveInviteForToken` 兩個查詢點，實作時逐一確認。
- **[Risk] 既有資料庫中已有的 `ProxyInviteToken` 紀錄（補發作廢產生的）`voidedAt` 皆為 null、`usedAt` 已被舊邏輯標記。** 這些舊紀錄在新規則下會被誤判為「已完成註冊」。Mitigation：此為歷史資料的顯示落差，不影響新邏輯的有效性判定正確性；該功能上線至今時間短、受影響筆數極少，不另外寫資料回填腳本。

## Migration Plan

1. `prisma/schema/user.prisma` 的 `ProxyInviteToken` 新增 `voidedAt DateTime?`；`make schema-update name=add_proxy_invite_token_voided_at`。
2. 純新增可選欄位，對既有資料無破壞性影響，不需清空 DB 重置流程。
3. 部署順序：先部署 migration（`make prisma-test-deploy`），再部署應用程式（`make tunnel-deploy-test`）。

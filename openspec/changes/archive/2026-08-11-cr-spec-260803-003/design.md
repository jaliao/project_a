## Context

專案完全沒有檔案上傳的既有基礎設施（`grep` 全專案 `upload`/`multipart`/`S3Client`/`R2` 皆無結果，`public/` 目錄不存在）。`.env`／`.env.example` 已預留 Cloudflare R2 設定框架（`R2_ACCOUNT_ID`／`R2_ACCESS_KEY_ID`／`R2_SECRET_ACCESS_KEY`／`R2_BUCKET_NAME`／`R2_ENDPOINT`，皆為註解狀態）與 `@aws-sdk/client-s3`／`@aws-sdk/s3-request-presigner` npm 依賴，但從未被任何程式碼使用——本次是第一個實際落地的 R2 整合。

正式站以 Docker `output: standalone` 部署，`docker-compose.prod.yml` 的 `web` service 沒有掛載任何 volume，若把上傳檔案存進容器本機檔案系統，重新部署即遺失；這也是排除「存本機檔案系統」方案、確認採用 R2 的直接原因（已與提出人確認）。

`User` model 目前有 `image String?`（NextAuth 標準欄位）。追蹤 `lib/auth.ts` 的 `jwt` callback，`image` 只在 `account?.provider === 'google'` 且**首次建帳**時由 PrismaAdapter/NextAuth 寫入一次，後續登入不會自動同步覆寫既有值——但為了語意乾淨、避免任何未來的 NextAuth/adapter 行為變化意外覆寫使用者辛苦上傳的自訂頭像，本次新增獨立欄位 `avatarKey`，不覆用 `image`。

`components/ui/message.tsx` 的 `MessageAvatar` 目前是純 CSS 圓形 div（無 `<img>`），`cr-spec-260803-001` 已在其 design.md 註明「先用預設圖示，不接真實頭像」——本次補上。

## Goals / Non-Goals

**Goals:**
- 使用者可在個人資料頁上傳／更換／移除自己的頭像（jpg/png/webp，2MB 內）。
- 頭像儲存於 R2（新建 project_a 專屬 bucket，公開讀取），不佔用資料庫、不受 Docker 部署影響。
- 頭像顯示三層 fallback：自訂上傳 → Google 頭像 → 預設圖示，套用於個人資料頁／學員專屬頁面／Topbar／站內訊息。

**Non-Goals（本次明確不做）：**
- 不做圖片裁切／編輯 UI（上傳即原圖存檔，顯示時以 CSS `object-fit: cover` 裁成圓形，不要求使用者上傳前先裁切成正方形）。
- 不做頭像審核機制（上傳即生效，不需管理者審核內容——內部教會系統，信任使用者自律，需求本身未提及審核）。
- 不做管理者代為管理／上傳會員頭像的後台功能。
- 不擴大顯示範圍到後台會員列表、課程卡片、提問管理列表、FAQ 留言等其他大量列表——本次僅四處（見 proposal），其餘留待未來有需要再擴充。
- 不做私有 bucket + 動態簽名 URL（`@aws-sdk/s3-request-presigner` 保留但本次不使用）——頭像是公開展示內容，公開讀取 URL 更簡單、效能更好（可被瀏覽器／CDN 快取），不需要每次 render 都對 R2 簽名。
- 不做前端 presigned PUT 直傳，上傳走 Server Action 伺服器端直傳（專案已有 `experimental.serverActions.bodySizeLimit: '12mb'`，2MB 頭像檔案綽綽有餘），因此也不需要設定 R2 CORS。
- 不處理 R2 實際帳號金鑰的申請／填入 `.env`（提出人自行處理）。
- 不做多頭像／頭像歷史紀錄，`avatarKey` 單一欄位、覆寫即取代，舊物件於覆寫／移除時刪除。

## Decisions

### 資料模型

```prisma
// prisma/schema/user.prisma（User model 新增欄位）
avatarKey String? // R2 object key，例如 avatars/{userId}/{uuid}.webp；null = 未上傳自訂頭像
```

### R2 Storage Helper

新增 `lib/storage/r2.ts`：

```ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<void> {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  }))
}

export function getPublicUrl(key: string): string {
  return `${process.env.R2_PUBLIC_URL}/${key}`
}
```

- `region: 'auto'` 為 R2 相容 S3 API 的標準寫法（R2 忽略 region 但 SDK 要求給值）。
- 刪除操作皆為 fire-and-forget（catch 後 log，不阻斷主流程）——刪除失敗頂多留下孤兒物件，不影響使用者當下操作。

### 頭像顯示 URL 組出邏輯

新增 `lib/utils/avatar.ts`：

```ts
export function resolveAvatarUrl(user: { avatarKey: string | null; image: string | null }): string | null {
  if (user.avatarKey) return getPublicUrl(user.avatarKey)
  return user.image ?? null
}
```

三層 fallback 的第三層（預設圖示／姓名縮寫）交給 `AvatarFallback` 處理（`resolveAvatarUrl` 回傳 `null` 時，`AvatarImage` 不渲染，`Avatar` 元件自動顯示 `AvatarFallback`，這是 Radix Avatar 的標準行為，不需要額外判斷邏輯）。

### 共用顯示元件

新增 `components/shared/user-avatar.tsx`（沿用 `components/ui/avatar.tsx` 的 shadcn 元件）：

```tsx
'use client'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

type UserAvatarProps = {
  avatarUrl: string | null
  displayName: string
  className?: string
}

export function UserAvatar({ avatarUrl, displayName, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
      <AvatarFallback>{displayName.slice(0, 1)}</AvatarFallback>
    </Avatar>
  )
}
```

- `displayName` 由呼叫端傳入（`getMemberDisplayName` 結果），`AvatarFallback` 取首字（中文姓名取姓氏／暱稱首字，英文取首字母，簡單一致，不做複雜的縮寫演算法）。
- 這是純顯示元件（無資料存取），可在 Server Component 或 Client Component 中使用。

### Server Actions

新增 `app/actions/avatar.ts`：

- `uploadAvatar(formData: FormData)`：
  1. `auth()` 登入檢查。
  2. 取出 `formData.get('file')`，驗證為 `File` 實例、`type` 屬於 `['image/jpeg', 'image/png', 'image/webp']`、`size <= 2 * 1024 * 1024`（驗證訊息走既有 `validation.*` i18n 慣例，新增 `validation.avatarTypeInvalid`／`validation.avatarTooLarge`）。
  3. 查出目前 `avatarKey`（若有，稍後刪除舊物件）。
  4. 產生新 key：`avatars/${userId}/${randomUUID()}.${ext}`（副檔名依 `file.type` 對應，避免信任使用者檔名）。
  5. `file.arrayBuffer()` → `Buffer.from(...)` → `uploadToR2(key, buffer, file.type)`。
  6. `prisma.user.update({ where: { id }, data: { avatarKey: key } })`。
  7. 若步驟 3 查到舊 `avatarKey`，`deleteFromR2(oldKey)`（fire-and-forget）。
  8. `revalidatePath('/', 'layout')`（頭像出現在 Topbar，屬於全站共用 layout，比照 `createNotification` 的 revalidate 範圍）。
- `removeAvatar()`：
  1. `auth()` 登入檢查。
  2. 查出目前 `avatarKey`；若為 `null`，直接回傳成功（無需操作）。
  3. `prisma.user.update({ where: { id }, data: { avatarKey: null } })`。
  4. `deleteFromR2(oldKey)`（fire-and-forget）。
  5. `revalidatePath('/', 'layout')`。

### Session 整合

比照既有 `isProfileComplete` 模式（`lib/auth.ts` 兩處 JWT callback），查詢時一併帶出 `avatarKey`／`image`，寫入 `token.avatarUrl = resolveAvatarUrl(dbUser)`；`session` callback 對應寫入 `session.user.avatarUrl`。`types/next-auth.d.ts` 的 session 型別擴充新增 `avatarUrl: string | null`。

### 套用位置細節

- **個人資料頁**（`/profile`、`/user/[spiritId]/profile`）：`profile-form.tsx` 頂部新增頭像區塊——`UserAvatar` 預覽（大尺寸）＋「上傳新頭像」`<input type="file" accept="image/jpeg,image/png,image/webp">`（選檔後立即呼叫 `uploadAvatar`，不需要額外送出按鈕，比照常見大頭貼上傳 UX）＋「移除頭像」按鈕（`avatarKey` 有值時才顯示）。
- **學員專屬頁面**（`/user/{spiritId}`）：基本資料區塊「姓名」欄位旁新增 `UserAvatar`（讀 `user.avatarKey`／`user.image`，該頁 `select` 需新增這兩個欄位）。
- **Topbar**：「個人資料」按鈕的 `IconUser` 替換為 `UserAvatar`（`size-8` 小尺寸），資料來自 `session.user.avatarUrl`（新增 prop 傳入，比照 `roles`／`spiritId`）。
- **站內訊息**：`components/conversation/conversation-thread.tsx` 目前 `MessageAvatar` 內寫死 `<IconUser />`；`ConversationThreadMessage` 型別新增 `authorAvatarUrl: string | null`，`lib/data/conversation.ts` 的 `messageSelect`／`mapMessages` 一併帶出 `author.avatarKey`／`author.image` 並用 `resolveAvatarUrl` 組好傳入，元件內改用 `UserAvatar`。

## Risks / Trade-offs

- [風險] 本次是專案第一次真正整合 R2，`@aws-sdk/client-s3` 從未在此程式碼庫實際跑過，可能遇到未預期的認證／CORS／權限設定問題 → Mitigation：上傳走伺服器端直傳（不需要 CORS），Decisions 中列出的程式碼盡量貼近 AWS SDK v3 標準用法；驗證階段（tasks 最後）明確列出「確認 R2 憑證已填入 `.env` 且可成功上傳/刪除」作為前置條件，若卡在憑證問題屬於環境設定而非程式邏輯錯誤。
- [風險] Bucket 設為公開讀取，任何知道 object key 的人皆可讀取圖片 → Mitigation：頭像本質是公開展示內容（本來就會顯示在個人頁等公開頁面），且 key 含 `randomUUID()`，不可預測、不可枚舉，風險可接受。
- [風險] 刪除舊物件為 fire-and-forget，若失敗會留下孤兒物件（增加 R2 儲存空間但不影響功能） → Mitigation：頭像檔案小（≤2MB）且更新頻率低，孤兒物件累積速度慢，暫不做定期清理排程，未來若空間成本明顯可另開 CR 處理。
- [風險] `avatarKey` 與 `image` 分開儲存，顯示邏輯需要呼叫端都正確使用 `resolveAvatarUrl`／`session.user.avatarUrl`，未來若有新頁面直接讀 `user.image` 而忘記檢查 `avatarKey` 會顯示錯誤（漏掉自訂頭像） → Mitigation：新增的四個套用點皆透過 `resolveAvatarUrl` 或 session 統一組出，未來新增顯示點時應遵循同一 helper，設計文件已明確記錄此慣例。

# 4. 核心資料模型

> 屬於 [README-AI.md](../README-AI.md) 拆分章節，回索引請見該檔。

### CourseCatalog
```
id            Int（主鍵，autoincrement）
label         String（課程名稱，DB 唯一來源）
description   String?（課程簡介，選填）
isActive      Boolean（預設 false；true 才可開課）
sortOrder     Int（預設 0；決定顯示順序）
prerequisites CourseCatalog[]（多對多自關聯，_CoursePrerequisites join table，累積式：啟動靈人 N 需先修 1..N-1）
```

### User
```
id            UUID（主鍵）
email         String（唯一，登入帳號；可經帳號修改功能變更——本人（密碼確認）或管理者，見 account-email-change）
name          String?
roles         UserRole[] (多重身分；user 基線 + teacher_1~teacher_3（三個書籍講師）/admin/superadmin，預設 [user])
spiritId      String?（唯一，格式 PA+YY+XXXX）
teacherNo     String?（授課老師編號，如 A001；學員為 null）
passwordHash  String?（Google-only 為 null）
isTempPassword Boolean（臨時密碼強制變更旗標）
commEmail     String?（通訊 Email）
realName      String?
englishName   String?（英文名稱）
nickname      String?（自訂暱稱，最多 20 字）
gender        Gender（male | female | unspecified，預設 unspecified）
birthYear     Int?（出生年，西元 4 位數；onboarding 必填、可於個人資料維護）
displayNameMode DisplayNameMode（nickname | nickname_zh | nickname_en，預設 nickname）
phone         String?
address       String?
createdAt / updatedAt / lastLoginAt / previousLoginAt
```
> `lastLoginAt`／`previousLoginAt`：每次登入成功於 `signIn` callback 以原子 SQL 平移記錄（舊 `lastLoginAt` → `previousLoginAt`，`lastLoginAt` → NOW()），失敗不阻斷登入。會員詳情頁「活躍度」區與 Excel 匯出據此推導「首次登入／首次補填（`realName && phone`）／臨時密碼狀態（`isTempPassword`，無密碼帳號為不適用）」。

### WhitelistedEmail
```
email     String（唯一）
isActive  Boolean（控制登入許可）
```

### Notification
```
id        Int（主鍵，autoincrement）
userId    String（關聯 User UUID）
title     String
body      String（Text）
isRead    Boolean（預設 false）
readAt    DateTime?（標記已讀時間）
createdAt DateTime
```

### CourseInvite
```
id            Int（主鍵）
title         String（課程名稱，由 courseCatalog.label 自動填入）
courseCatalogId Int（關聯 CourseCatalog）
maxCount      Int（預計人數）
expiredAt     DateTime?（邀請截止日期，選填）
orders        CourseOrder[]（一對多：一門課可多筆教材訂單）
createdById   String（建立者 UUID）
createdAt     DateTime
cancelledAt   DateTime?（有值代表已取消）
cancelReason  String?（取消原因文字）
completedAt   DateTime?（有值代表已結業）
isPublicMatch Boolean（是否公開媒合，預設 false）
matchNote     String?（公開招募備註，選填）
```

### InviteEnrollment
```
id             Int（主鍵）
inviteId       Int（關聯 CourseInvite）
userId         String（學員 UUID）
status         EnrollmentStatus（pending | approved，預設 pending）
materialChoice MaterialChoice（none | traditional | simplified，預設 none）
joinedAt       DateTime
graduatedAt          DateTime?（結業時間；有值代表通過結業）
nonGraduateReason    String?（未結業原因：insufficient_time | other）
teacherRecommended   Boolean?（講師資格回饋：null=未填、true=推薦、false=不推薦）
teacherFeedbackNote  String?（回饋選填備註）
teacherFeedbackAt    DateTime?（回饋填寫/更新時間）
@@unique([inviteId, userId])
```

### CourseMessage
```
id        Int（主鍵，autoincrement）
inviteId  Int（關聯 CourseInvite，onDelete: Cascade）
authorId  String（作者 UUID）
body      String（留言內容，Text）
parentId  Int?（null = 提問；有值 = 回覆，自關聯 CourseMessageReplies，onDelete: Cascade）
createdAt DateTime
@@index([inviteId])
```
課程 FAQ 留言：任何登入會員可提問（parentId=null），僅授課老師可回覆（parentId 指向提問）。**可見性為 1 對 1**：每則提問串僅發問者本人與授課老師可見（`getCourseMessages` 依 viewer 過濾，老師見全部、其他會員僅見 `authorId === 自己` 的串）。

### Church
```
id        Int（主鍵，autoincrement）
name      String（唯一）
isActive  Boolean（預設 true）
sortOrder Int（預設 0）
users     User[]
```

### User（所屬教會欄位）
```
churchType  ChurchType（church | other | none，預設 none）
churchId    Int?（關聯 Church，onDelete: SetNull）
churchOther String?（churchType = other 時的自填文字）
```

### AdminActionLog
```
id           Int（主鍵，autoincrement）
action       String（動作代碼，值域見 config/admin-log-action.ts：enrollment_add | enrollment_remove | member_delete）
actorId      String?（操作管理者 UUID，onDelete: SetNull）
targetUserId String?（對象學員 UUID，onDelete: SetNull）
inviteId     Int?（班級，onDelete: SetNull）
actorName    String（快照：操作者姓名）
targetName   String（快照：對象姓名＋email）
inviteTitle  String?（快照：#班級編號＋課程名稱；無課程情境操作如 member_delete 為 null）
detail       String?（摘要，如「補登結業 2025/09/01」「刪除會員」）
createdAt    DateTime
```
管理操作紀錄（涵蓋班級學員新增/移除、會員刪除）。FK 全 optional＋SetNull＋文字快照：對象會員/班級日後被刪除時紀錄仍完整可讀；寫入與對應操作同一交易（失敗回滾不留紀錄）。

### AdminSetting
```
key   String（主鍵，@unique）
value String（值為字串，應用層轉型）
```
目前使用的鍵：
- `hierarchy_depth`：學習階層展開層數，整數字串，預設 `"3"`，有效範圍 1–10

### CourseOrder
```
id              Int（主鍵，autoincrement）
buyerNameZh     String（購買人中文姓名）
buyerNameEn     String（購買人英文姓名）
teacherName     String（教師姓名）
churchOrg       String（所屬教會/單位）
email           String
phone           String
materialVersion MaterialVersion（traditional | simplified | both）
purchaseType    PurchaseType（selfOnly | selfAndProxy | proxyOnly）
studentNames    String?（代購學員姓名，代購時必填）
quantity        Int（1–8；選「其他」時為 0）
quantityNote    String?（自填數量說明）
courseDate      String（預計開課日期，可為「無」）
taxId           String?（統一編號，選填）
deliveryMethod  DeliveryMethod（sevenEleven | familyMart | delivery）
deliveryAddress String?（收件地址，全家/郵寄用）
storeId         String?（超商門市店號，透過 ECPay MapCVS 選擇器取得）
storeName       String?（超商門市名稱，透過 ECPay MapCVS 選擇器取得）
submittedById   String?（提交者 UUID，選填關聯 User）
shippedAt       DateTime?（管理者確認寄送時間）
receivedAt      DateTime?（講師確認收件時間）
traditionalQty  Int（本筆申請繁體本數；由送出書本項目推導，單/多地址皆逐本清單）
simplifiedQty   Int（本筆申請簡體本數）
courseInviteId  Int?（一對多：關聯 CourseInvite；獨立訂單為 null）
createdAt       DateTime
```
> 開課門檻（`lib/utils/course-start-gate.ts`）：≥1 已核准學員 + **教材需求已處理**（`remaining` 繁/簡皆 0 **或** `CourseInvite.materialFinalizedAt != null`）+ 所有教材訂單 `receivedAt != null`；全班不需教材（總需求 0、無訂單）時後兩項自動成立。`startCourseSession` 與課程詳情頁「開始上課」按鈕共用此判定（server 端以 `getEnrollmentMaterialSummary`＋訂單繁/簡加總重算 remaining），未達門檻按鈕停用並列出原因。
> 教材申請進度（`lib/utils/material-progress.ts`）：總需求＝已核准學員 materialChoice 統計、已申請＝訂單繁/簡加總、尚未申請＝差值——**參考統計、不設上限**。申請採**逐本清單**（單一地址預設全選未指派書、可改版本/取消勾選；多地址逐本指派、未指派＝本次不申請）＋**加購項目**（`MaterialShipmentItem.enrollmentId = null`，書名須輸入，無預設值）；版本覆寫只寫入訂單快照、不回寫 `materialChoice`。教材作業授權為**講師或管理者**（購買人快照一律取課程講師，`submittedById` 記操作者）；「完成教材申請」`finalizeMaterialOrders`/`reopenMaterialOrders`（寫 `materialFinalizedAt`＋AdminActionLog）完成時停用申請並豁免開課教材需求。講師操作區為三區塊（教材申請／開始上課／取消上課）。

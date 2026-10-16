## Context

現行自助註冊（`app/actions/auth.ts` 的 `registerWithEmail`）僅驗證 `email`（`lib/schemas/auth.ts` 的 `registerSchema`），通過即 `prisma.user.create`，姓名等基本資料留空，待登入後 onboarding 精靈 Step 2（`completeOnboardingProfile` + `lib/schemas/profile.ts` 的 `onboardingProfileSchema`）才要求填寫 `realName`／`phone`／`gender`／`birthYear`／所屬教會（`churchType`/`churchId`/`churchOther`）。Step 2 的欄位與驗證規則（含 `PHONE_REGEX`、出生年範圍、教會 `superRefine`）已存在，可直接重用。

`/onboarding` 頁（`app/[locale]/(guest)/onboarding/page.tsx`）目前依 `isTempPassword` 決定 `initialStep`（true→1，false→2），Wizard（`onboarding-wizard.tsx`）內 Step 1 成功後**寫死**切到 Step 2。

## Goals / Non-Goals

**Goals:**
- `/register` 一次性收集 Email＋完整基本資料，驗證全部通過才建立 `User`。
- 驗證不通過時不留下任何伺服器端紀錄（沒有半成品帳號、沒有待清理的暫存資料）。
- 已於註冊時填妥資料的帳號，登入後 onboarding 不重複要求填寫同一批資料。
- 重用 onboarding Step 2 既有的驗證規則與欄位定義，不重複一份。

**Non-Goals:**
- 不改變 Google OAuth 首次登入流程（仍自動建帳，手機/性別/出生年/教會仍透過 onboarding Step 2 補填——OAuth 無法在建帳前先跳出表單收集這些資料）。
- 不改變管理者/講師手動建立會員（`lib/member-creation.ts` 的 `createLoginableMember`）的必填規則（僅要求 `realName`，不要求手機/性別/出生年/教會）——其建立者是管理者本人，非自助流程，不是本次問題來源。
- 不新增資料庫 schema、不新增「暫存註冊」資料表。

## Decisions

- **「延後建立帳號」的實作方式：單次原子送出 + 驗證，不開暫存資料表。**
  `/register` 表單把 Email 與完整基本資料放在同一個 React Hook Form、同一次送出、同一個 `registerWithEmail` server action 呼叫內，以合併後的 zod schema 一次驗證；只有驗證全部通過，才在該次呼叫內 `prisma.user.create`。驗證失敗時表單資料只留在使用者瀏覽器（React state），伺服器端什麼都沒寫入。
  理由：這樣已經滿足「驗證沒過就不算註冊成功、不建立帳號」的目標，且不需要處理「暫存資料表裡的半成品資料本身也會變成新的待清理垂垢」這個問題（例如需要 TTL、過期清理 job、重複送出去重邏輯），避免用一個新的髒資料累積問題取代舊的。這與一次性多步驟、需要跨瀏覽器會話接續填寫的情境不同（本次表單欄位雖多但仍可一次性呈現，不需要分段儲存）。
- **表單欄位與驗證規則重用 onboarding Step 2，不重寫一份。**
  `lib/schemas/profile.ts` 抽出共用的基本資料欄位定義（`realName`／`phone`／`gender`／`birthYear`／`churchType`／`churchId`／`churchOther` 及其 `superRefine` 教會檢查），讓 `onboardingProfileSchema` 與新的註冊 schema 共用，避免 `PHONE_REGEX`、出生年範圍、教會檢查邏輯/錯誤訊息分成兩份維護。
  `lib/schemas/auth.ts` 的 `registerSchema` 改為 `email` 欄位 + 上述共用基本資料欄位組成。
- **`registerWithEmail` 寫入邏輯比照 `completeOnboardingProfile`。**
  `churchId`／`churchOther` 依 `churchType` 清空另一邊（`churchType==='church'` 才寫 `churchId`，`'other'` 才寫 `churchOther`），與 `completeOnboardingProfile` 現有邏輯一致，避免兩處各自長出一套轉換規則。
- **Onboarding 跳過 Step 2 的判斷：於 `/onboarding` page.tsx 算好布林值傳給 Wizard，不在 Wizard 內重查資料庫。**
  `profileAlreadyComplete = Boolean(realName && phone && gender && birthYear && churchType)`；Step 1 的 `onSuccess` 依此值決定 `setStep(3)` 還是 `setStep(2)`。
  理由：`/onboarding` page.tsx 本來就已經 `prisma.user.findUnique` 撈出這些欄位（用於算 `initialStep`），多算一個布林值零額外查詢成本；放在 Wizard 內部重查則是多一次不必要的 round-trip。
- **不要求既有（歷史）帳號補資料才能繼續使用。**
  本 CR 僅改變「未來新建立的帳號」的成立條件；現有帳號缺資料的情況由 `profile-completion-guard`（既有能力，已強制登入後導向 Profile 頁）與 CR-SPEC-261016-001（這次查出的 22 筆既有資料補救）分別處理，不在本次範圍內疊加新規則。

## Risks / Trade-offs

- [`/register` 表單欄位變多，可能降低註冊轉換率] → 這是本次 CR 明確要的取捨（基本資料不全不算註冊成功），且欄位與 onboarding Step 2 相同、使用者反正逃不掉；若日後轉換率數據顯示有問題，可另案評估是否放寬必填範圍。
- [`registerSchema` 與 `onboardingProfileSchema` 共用欄位定義，兩者任一邊的欄位需求若未來分岔（例如某欄位只在其中一處該必填）會需要拆開] → 目前兩處的必填欄位集合完全相同，暫無分岔跡象；真的分岔時再各自覆寫即可，不預先拆分。

## Migration Plan

- 無資料庫 schema 變更。純修改 `registerSchema`／`registerWithEmail`／`/register` 頁與表單／`onboarding` page.tsx 與 Wizard 的 Step 1→Step 2/3 判斷。部署即生效；回退僅需還原這幾個檔案，不影響既有會員資料。
- 既有「只有 Email、無基本資料」的帳號（含本次查出的 22 筆）不受此變更影響，其補資料流程交由 CR-SPEC-261016-001 與既有 `profile-completion-guard` 處理。

## Open Questions

（無）

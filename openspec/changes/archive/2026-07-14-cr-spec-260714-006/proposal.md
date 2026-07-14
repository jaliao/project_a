# cr-spec-260714-006 會員帳號（登入 Email）修改功能

## Why

登入帳號 email 目前建檔後不可變，實務上會員打錯字、換信箱、或以錯誤信箱建檔時，只能靠「找回帳號」流程（限從未登入者）或重新註冊（造成重複帳號）。需要提供正式的帳號修改能力：管理者可代改、會員本人也能在個人資料頁自行修改，並讓會員清楚看到自己目前的登入帳號。

## What Changes

- **後台會員管理 → 特殊設定分頁**新增「**帳號修改**」功能：管理者直接輸入新 email（唯一性檢查）後生效；新 email 加入白名單（`isActive=true`）、舊 email 白名單停用。不寄信、不發通知（管理者當面告知）。
- **前台個人資料頁**於「變更密碼」卡**上方**新增「**帳號修改**」卡：
  - 輸入**新 email＋目前密碼**，確認視窗（顯示新舊 email）後**立即生效**，下次以新 email 登入；打錯鎖外時可用既有「找回帳號」救援。
  - **Google-only 使用者（無密碼）不開放自改**：卡片顯示「請洽管理員協助修改」提示（後台特殊設定仍可代改）。
- **前台個人資料頁**於「啟動事工編號」**下方**新增「**啟動帳號資訊**」呈現：目前登入帳號（email）與登入方式（密碼／Google 綁定），唯讀。
- 共通規則：email 正規化（trim＋小寫）、與現有帳號唯一性檢查；變更僅動 `User.email` 與白名單，**不影響** `commEmail`（通訊信箱）、Google 綁定關係（`Account`）、報名／結業等資料。

## Capabilities

### New Capabilities

- `account-email-change`: 登入帳號 email 變更的共通規則（唯一性、白名單汰換、密碼確認、Google-only 限制）、個人資料頁「帳號修改」卡與「啟動帳號資訊」顯示、管理者變更 action。

### Modified Capabilities

- `admin-member-management`: 特殊設定分頁新增「帳號修改」區塊（入口，行為依 `account-email-change`）。

## Impact

- **Server Actions**：新增本人改帳號 action（session 本人＋bcrypt 密碼驗證＋Google-only 拒絕）與管理者改帳號 action（`canAccessAdmin`）；共用 email 檢查與白名單汰換邏輯。
- **UI**：`app/[locale]/(user)/user/[spiritId]/profile/page.tsx`（啟動帳號資訊、帳號修改卡）、後台會員詳情特殊設定分頁（`member-special-settings` 區塊）。
- **Session**：JWT 每請求自 DB 同步，變更後現有 session 續用；UI 於成功後提示「下次登入請使用新帳號」。
- **無 DB schema 變更**（沿用 `User.email` 與 `WhitelistedEmail`；比照找回帳號流程的白名單 upsert，另加停用舊 email）。
- **手冊**：`doc/管理者操作手冊.md`（特殊設定）、`doc/學員手冊.md`（個人資料頁帳號修改與帳號資訊）；`config/version.json` patch +1。
- **不做**：新 email 驗證信流程（pendingEmail）、email 變更通知信、變更歷史紀錄。

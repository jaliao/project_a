# cr-spec-260714-006 Tasks

## 1. 共用核心與 Server Actions

- [x] 1.1 新增 `lib/account-email-change.ts`：email 正規化＋格式驗證、唯一性檢查（他人占用／與現值相同回欄位錯誤）、交易內三步（`user.update({ email })`、舊 email 白名單 `isActive=false`、新 email 白名單 upsert `isActive=true`）
- [x] 1.2 `app/actions/profile.ts` 新增 `changeMyAccountEmail(newEmail, currentPassword)`：session 本人；`passwordHash === null` 拒絕「請洽管理員協助修改」；`bcrypt.compare` 驗證密碼（錯誤回欄位錯誤）；呼叫共用核心；成功 message 含「下次登入請使用新帳號」；`revalidatePath`
- [x] 1.3 `app/actions/admin.ts` 新增 `changeMemberEmailAdmin(userId, newEmail)`：`canAccessAdmin`；免密碼、可對 Google-only 會員操作；呼叫共用核心；`revalidatePath`
- [x] 1.4 `lib/auth.ts` JWT else 分支 select 補 `email` 並寫回 `token.email`（session email 隨變更同步）

## 2. 前台個人資料頁

- [x] 2.1 「啟動事工編號」卡下方（分隔線後）顯示「啟動帳號資訊」：登入 email＋登入方式標示（密碼登入依 `hasPassword`、Google 登入依 `linkedProviders`，可並存），唯讀
- [x] 2.2 新增 `profile/change-account-card.tsx`（client）：有密碼者顯示表單（新 email＋目前密碼）＋AlertDialog 確認（新舊 email 並列＋下次登入提醒）→ 呼叫 action → 成功 toast＋`router.refresh()`；Google-only 者同位置顯示「請洽管理員協助修改」說明卡
- [x] 2.3 `profile/page.tsx` 掛載：順序 `ProfileForm` → 帳號修改卡 → `ChangePasswordCard`（維持變更密碼上方），傳入 `currentEmail`／`hasPassword`

## 3. 後台特殊設定

- [x] 3.1 新增 `components/admin/member-email-form.tsx`（client）：顯示目前帳號 email、新 email 輸入、AlertDialog 確認（新舊並列）→ `changeMemberEmailAdmin` → toast＋`router.refresh()`
- [x] 3.2 會員詳情特殊設定分頁新增「帳號修改」區塊（置於「補發密碼」之後、「特殊身分授權」之前），傳入 `userId` 與目前 email

## 4. 驗證

- [x] 4.1 `npm run lint` 與 `npm run build` 通過
- [x] 4.2 手動驗證——前台：具密碼者改帳號成功（確認視窗、成功後帳號資訊更新、登出後新 email 可登入、舊 email 不可）；密碼錯誤回欄位錯誤；新 email 已被使用／與現值相同擋下；Google-only 顯示說明卡且 action 被拒
- [x] 4.3 手動驗證——後台：特殊設定改會員帳號成功（含 Google-only 會員）；非管理者呼叫被拒；改後白名單新啟用、舊停用
- [x] 4.4 手動驗證——連動：改帳號後通訊信箱、Google 綁定、課程/報名資料不變；現有 session 續用且個人資料頁顯示新 email

## 5. 文件與版本

- [x] 5.1 更新 `doc/管理者操作手冊.md`：特殊設定新增「帳號修改」說明（含 Google-only 代改），更新檔首版本標註與日期
- [x] 5.2 更新 `doc/學員手冊.md`：個人資料頁新增「啟動帳號資訊」與「帳號修改」說明（Google 登入者請洽管理員），更新檔首版本標註與日期
- [x] 5.3 `config/version.json` patch +1 並更新 `updatedAt`
- [x] 5.4 依 `.ai-rules.md` 重新產生 `README-AI.md`

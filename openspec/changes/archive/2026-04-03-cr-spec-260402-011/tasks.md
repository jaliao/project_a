## 1. 資料庫 Schema

- [x] 1.1 更新 `prisma/schema/user.prisma`：新增 `Gender` enum（`male | female | unspecified`，預設 `unspecified`）、`DisplayNameMode` enum（`chinese | english`，預設 `chinese`）、`englishName String?`、`gender Gender @default(unspecified)`、`displayNameMode DisplayNameMode @default(chinese)` 欄位
- [x] 1.2 執行 `make schema-update name=add_user_profile_fields` 建立遷移並重新生成 client

## 2. 顯示名稱 Helper 與元件

- [x] 2.1 新增 `lib/utils/member-display.ts`，實作 `getMemberDisplayName(user)` 純函式（接收 `realName/nickname/englishName/name/displayNameMode`，套用括號省略規則）
- [x] 2.2 新增 `components/member/member-display-name.tsx`（薄包裝元件，接收相同 props，渲染 `getMemberDisplayName` 結果）

## 3. Profile 表單更新

- [x] 3.1 更新 `lib/schemas/profile.ts`：新增 `englishName`（optional string）、`gender`（enum）、`displayNameMode`（enum）欄位驗證
- [x] 3.2 更新 `app/actions/profile.ts` `updateProfile`：從 FormData 讀取並儲存三個新欄位
- [x] 3.3 更新 `app/(user)/profile/page.tsx`：查詢加入 `englishName`、`gender`、`displayNameMode`，傳入 ProfileForm
- [x] 3.4 更新 `app/(user)/profile/profile-form.tsx`：新增英文名稱 Input、性別 Select（未設定/男/女）、顯示名稱偏好 Select（匿名（中文名稱）/匿名（英文名稱）），偏好選擇旁顯示即時預覽名稱

## 4. 會員詳情頁更新

- [x] 4.1 更新 `lib/data/members.ts` `getMemberDetail`：查詢加入 `englishName`、`gender`、`displayNameMode`
- [x] 4.2 更新 `app/(user)/admin/members/[id]/page.tsx`：基本資料區塊新增英文名稱、性別、顯示名稱三欄；使用 `getMemberDisplayName()` 計算顯示名稱
- [x] 4.3 更新 `app/(user)/admin/members/page.tsx`（清單頁）：會員名稱欄改用 `getMemberDisplayName()`
- [x] 4.4 更新 `components/admin/member-hierarchy-tree.tsx`：節點名稱改用 `getMemberDisplayName()`（需在 hierarchy query 中補查 `nickname/englishName/displayNameMode`）
- [x] 4.5 更新 `components/course-session/enrolled-students-list.tsx`：學員名稱改用 `getMemberDisplayName()`（需補查相關欄位）

## 5. Seed 資料全面更新

- [x] 5.1 更新 `prisma/seed.ts` 管理者 email → `101@iwillshare.org.tw`（spiritId 保持 `PA000001`，update 不覆蓋 passwordHash）
- [x] 5.2 更新 `prisma/seed.ts` 會員列表（由 4 位擴充為 20 位），依指定順序：
  - PA260001 黃國倫 Gordon（男）
  - PA260002 吳容銘 Romen（男）
  - PA260003 Hilo（男，無中文名）
  - PA260004 Joyce（女，無中文名）
  - PA260005 湯尼（男，無英文名）
  - PA260006 Johni（男，無中文名）
  - PA260007 KT（男，無中文名）
  - PA260008 王明台（男，無英文名）
  - PA260009–PA260013（5 位，隨機中英文名、性別）
  - PA260014 Justin（男，englishName = 'Justin'）
  - PA260015–PA260020（6 位，隨機）
  - 所有會員含 `phone`、`churchId`（對應已建立的教會）、`gender`、`displayNameMode`
- [x] 5.3 `spiritIdCounter` 同步至 seq=20

## 6. 版本與文件

- [x] 6.1 `config/version.json` patch 版本號 +1
- [x] 6.2 依 `.ai-rules.md` 更新 `README-AI.md`

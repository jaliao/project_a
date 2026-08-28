## Context

個人資料頁有兩個實體檔案，但只有 `/user/[spiritId]/profile` 這條路由實際被使用：

- `app/[locale]/(user)/user/[spiritId]/profile/profile-form.tsx` — **使用中**（`page.tsx` `import ProfileForm from './profile-form'`）。第 190 行：`<label className="block text-sm font-medium mb-1">真實姓名 *</label>`，欄位 `profileForm.register('realName')`。
- `app/[locale]/(user)/profile/profile-form.tsx` — 舊路徑殘留，`page.tsx` 已改為純 redirect 到 `/user/[spiritId]/profile`，此 `profile-form.tsx` 無任何 import 引用（死碼）。

該表單所有欄位標籤目前皆為寫死中文（未 i18n 化）。實作時查證 `messages/*.json`：**並無 `profile` 命名空間**，唯一與 realName 相關的鍵為 `onboarding.realName` / `onboarding.realNamePlaceholder`（onboarding 精靈用，範圍外）與 `validation.realNameRequired` / `validation.realNameEnter`（驗證訊息，文字不變）。故個人資料頁沒有 i18n 訊息鍵需要一併更新，改寫死字串即為畫面實際生效方式。

## Goals / Non-Goals

**Goals：**
- 個人資料頁基本資料區塊的中文姓名欄位標籤顯示「中文姓名（若無中文姓名請填上您護照上的拼音姓名）」。

**Non-Goals：**
- 不把整個 `profile-form.tsx` 做 i18n 遷移（維持逐步遷移，超出改字範圍）。
- 不改欄位名稱（仍為 `realName`）、必填規則、Zod schema、送出流程。
- 不改 onboarding 精靈、後台會員管理、證書製作等處的「真實姓名」用語。
- 不改 placeholder 文案。

## Decisions

1. **只改寫死標籤字串（無 i18n 鍵可同步）**
   表單標籤目前是寫死字串，直接改該字串即為畫面實際生效方式。查證後 `messages/*.json` 沒有個人資料頁專屬的 realName 鍵（見 Context），故本次不動任何訊息目錄；`onboarding.realName` 屬另一流程、不在範圍內。

2. **舊死碼檔一併同步（低優先）**
   `app/[locale]/(user)/profile/profile-form.tsx` 雖無引用，仍把同一標籤改掉，避免日後有人誤複製舊字樣；若造成任何 lint/build 疑慮則可略過，不阻擋本變更。

3. **必填星號 `*` 保留**
   標籤格式維持「<文字> *」，僅置換文字部分。

## Risks / Trade-offs

- **[極低風險] 標籤變長影響版面** → 該欄位為單欄 `block` label，換行可接受，無 RWD 疑慮。
- 純文案變更，無資料回填、無 schema 變更，revert commit 即可回滾。

## Migration Plan

1. 改 `app/[locale]/(user)/user/[spiritId]/profile/profile-form.tsx` 第 190 行標籤文字。
2. 改 `app/[locale]/(user)/profile/profile-form.tsx` 同一標籤（舊死碼檔，保持一致）。
3. `npm run lint` + `npm run build`。
4. 同步 `doc/學員手冊.md` 相關字樣；`config/version.json` patch +1、`updatedAt` 更新。

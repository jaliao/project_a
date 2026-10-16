## Context

`InviteEnrollment.materialChoice` 已有兩條寫入路徑：學員自行報名（`applyToCourse`，可自選）與老師/管理者補登結業後手動新增（`addStudentToInvite`，目前寫死用 `getDefaultMaterialChoiceForUser` 自動判定、無法覆寫）。這次只需要讓第二條路徑也能被人工覆寫，不涉及新的資料模型。

## Goals / Non-Goals

**Goals:**
- 讓老師/管理者在新增學員當下就能看到並修改教材版本判定，避免事後才發現版本錯誤
- 維持與既有書籍選購 Dialog 一致的選項文案、順序與預設邏輯，不建立第二套不一致的 UI 慣例

**Non-Goals:**
- 不修改學員自行報名流程（`course-enrollment-application`）
- 不新增資料庫欄位、不做 migration
- 不處理教材訂購/出貨流程（`material-book-items`）——下游流程本來就直接讀 `InviteEnrollment.materialChoice`，本次只確保寫入值正確即可

## Decisions

### 決策：`addStudentToInvite` 新增可選參數，未帶入時維持現狀

**做法**：`addStudentToInvite` 的輸入型別新增 `materialChoice?: 'none' | 'traditional' | 'simplified' | 'english'` 與 `materialBookName?: string`。實作中：

```
const defaultMaterialChoice = await getDefaultMaterialChoiceForUser(existingUser.id)
const resolvedMaterialChoice = input.materialChoice ?? defaultMaterialChoice
```

建立 `InviteEnrollment` 時使用 `resolvedMaterialChoice`／帶入的 `materialBookName`（非「已有教材」時）。

**理由**：
- 向後相容——若未來有其他呼叫端（目前僅 `AddStudentDialog` 一處）不想處理這個欄位，維持現有自動判定行為，不會因本次改動而出錯。
- `getDefaultMaterialChoiceForUser` 的呼叫時機不變（仍在送出時查詢），避免 Dialog 開啟時就要額外打一次 API；Dialog 端可先用「開啟時已知的學員是否曾上過課」資訊做前端預選（透過 `StudentPicker` 選定學員後，呼叫既有的 `searchStudentsForInvite` 回傳資料或另外小查一次），實作時依現有資料可得性決定，不要求新增查詢端點。

### 決策：UI 文案與選項順序沿用既有書籍選購 Dialog 慣例

**做法**：選項順序固定為「繁體教材、簡體教材、英文教材、已有教材」，與 `course-enrollment-application` 規格一致；教材所屬姓名欄位沿用同一套必填規則——選版本選項時必填，選「已有教材」時不需填姓名。

**理由**：避免兩個教材選擇入口的文案與互動邏輯分裂，降低使用者（老師/管理者）認知負擔。

## Risks / Trade-offs

- [新增欄位為選填，若 Dialog 實作疏漏未傳值] → 可接受：自動回退為現有自動判定行為，不會比現況更差

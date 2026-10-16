## 1. Server Action 擴充

- [x] 1.1 `app/actions/invite-students.ts`：`addStudentSchema` 新增可選欄位 `materialChoice`（enum: none/traditional/simplified/english）與 `materialBookName`（string，選填），並加上 refine 規則：非 `none` 時 `materialBookName` 必填（與既有書籍選購 Dialog 的必填規則一致——spec 撰寫階段誤寫「選填」，實作時依既有 `course-enrollment-application` 規格的真實驗證規則修正為必填）
- [x] 1.2 `addStudentToInvite`：改為 `const resolvedMaterialChoice = input.materialChoice ?? defaultMaterialChoice`，建立 `InviteEnrollment` 時使用 `resolvedMaterialChoice` 與帶入的 `materialBookName`（非 `none` 時才寫入，`none` 時寫 `null`）
- [x] 1.2b 新增 `getMaterialChoiceDefaultForStudent(inviteId, userId)`：供 Dialog 選定學員後查詢預設教材選擇（授權規則同 `searchStudentsForInvite`），取代修改共用 `StudentPicker`/`student-picker.ts` 型別的方案——避免影響其他呼叫端（分享課程、聯繫成員等其他使用 `StudentPicker` 的情境）

## 2. UI：新增學員 Dialog

- [x] 2.1 `components/admin/invite-student-cells.tsx`（`AddStudentDialog`）：新增教材版本選擇 state（四選項，直接重用 `course.material.*`／`course.enroll.*Desc` 既有 i18n key，與 `enrollment-application-dialog.tsx` 完全一致的文案，不重複定義）
- [x] 2.2 選定學員後呼叫 `getMaterialChoiceDefaultForStudent` 取得預設值並設定選中狀態（曾上過課 → 已有教材，新生 → 繁體教材）
- [x] 2.3 選擇非「已有教材」選項時顯示教材所屬姓名輸入欄（必填，見 1.1 修正說明）
- [x] 2.4 送出時將選定的 `materialChoice`／`materialBookName` 一併帶入 `addStudentToInvite` 呼叫；伺服端 `materialBookName` 必填錯誤透過既有 `errors` 機制顯示於欄位下方

## 3. i18n

- [x] 3.1 **與原規劃不同**：教材版本選項文案（繁體/簡體/英文/已有教材＋說明）與教材所屬姓名欄位 label 直接重用既有 `course.material.*`／`course.enroll.{tradDesc,simpDesc,engDesc,noneDesc,bookNameLabel}` key，不新增重複翻譯；只新增 1 個新 key `course.inviteStudent.materialChoiceLabel`（選擇區塊標題「教材版本」/ "Material version"），已同步補上 zh-TW／en，並跑 `npm run gen:zh-cn` 重新產生簡體

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit` 與 `npm run build` 皆成功，無編譯錯誤
- [x] 4.2 **待使用者於瀏覽器手動驗收**（執行環境無瀏覽器）：新增一位從未上過課的學員確認預選「繁體教材」；新增一位曾上過課的學員確認預選「已有教材」；改選其他選項後送出，確認該學員報名記錄的 `materialChoice`／`materialBookName` 寫入正確
- [x] 4.3 **待使用者於瀏覽器手動驗收**：下游教材訂購流程（申請教材 Dialog）能正確讀到新增學員時設定的教材版本，產生對應書本項目（程式邏輯層面：下游 `getCourseBookItems` 直接讀 `InviteEnrollment.materialChoice`/`materialBookName`，未改動該查詢，理論上應自動吃到正確值，但未實際跑過畫面確認）
